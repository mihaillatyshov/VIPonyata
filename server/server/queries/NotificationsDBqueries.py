"""Запросы для ленты уведомлений и истории учителя: постраничная выборка и пакетная подгрузка связанных данных.

Страницы строятся по курсору (см. `PageCursor`): лента отсортирована по убыванию (datetime, rank, id),
следующая страница — всё, что строго «после» последнего элемента предыдущей.
"""
import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Sequence, TypedDict

from sqlalchemy import ColumnElement, and_, func, null, or_, select, true, update
from sqlalchemy.orm import defer

from server.common import DBsession
from server.models.db_models import (Assessment, AssessmentTry, Drilling, DrillingTry, FinalBoss, FinalBossTry,
                                     Hieroglyph, HieroglyphTry, HomeworkAssignment, HomeworkTry, Lesson,
                                     NotificationStudentToTeacher, NotificationTeacherToStudent, QuizletAssignment,
                                     QuizletAssignmentResult, QuizletAssignmentSubgroup, QuizletAssignmentTarget,
                                     QuizletAssignmentTargetSubgroup, QuizletSession, QuizletSubgroup, User,
                                     UserQuizletLesson, UserQuizletSubgroup, UserQuizletWord)
from server.models.notifications import PageCursor

# (модель попытки, модель активности, есть ли checked_tasks)
ACTIVITY_TRY_MODELS: dict[str, tuple[Any, Any, bool]] = {
    "drilling_try": (DrillingTry, Drilling, False),
    "hieroglyph_try": (HieroglyphTry, Hieroglyph, False),
    "assessment_try": (AssessmentTry, Assessment, True),
    "final_boss_try": (FinalBossTry, FinalBoss, True),
}


def after_cursor(sort_column, id_column, rank: int, cursor: PageCursor | None) -> ColumnElement[bool]:
    """Условие «строго после курсора» для источника с рангом `rank` в ленте по убыванию (datetime, rank, id)."""
    if cursor is None:
        return true()
    if rank < cursor.rank:
        return sort_column <= cursor.sort_datetime
    if rank > cursor.rank:
        return sort_column < cursor.sort_datetime
    return or_(sort_column < cursor.sort_datetime, and_(sort_column == cursor.sort_datetime, id_column < cursor.id))


#########################################################################################################################
################ Notifications page #####################################################################################
#########################################################################################################################
def get_teacher_notifications_page(cursor: PageCursor | None,
                                   limit: int | None) -> Sequence[NotificationStudentToTeacher]:
    notification = NotificationStudentToTeacher
    with DBsession.begin() as session:
        query = (
            select(notification)                                                                                        #
            .where(notification.deleted == False)                                                                       #
            .where(after_cursor(notification.creation_datetime, notification.id, 0, cursor))                            #
            .order_by(notification.creation_datetime.desc(), notification.id.desc()))
        if limit is not None:
            query = query.limit(limit)
        return session.scalars(query).all()


def get_teacher_unread_notifications_count() -> int:
    notification = NotificationStudentToTeacher
    with DBsession.begin() as session:
        return session.scalar(
            select(func.count(
                notification.id)).where(notification.deleted == False).where(notification.viewed == False)) or 0


def _student_notifications_conditions(user_id: int) -> list[ColumnElement[bool]]:
    notification = NotificationTeacherToStudent
    return [
        notification.deleted == False,
        or_(notification.student_id == user_id, AssessmentTry.user_id == user_id, FinalBossTry.user_id == user_id),
    ]


def _with_student_tries_join(query):
    notification = NotificationTeacherToStudent
    return (query                                                                                                       #
            .outerjoin(AssessmentTry, AssessmentTry.id == notification.assessment_try_id)                               #
            .outerjoin(FinalBossTry, FinalBossTry.id == notification.final_boss_try_id))


def get_student_notifications_page(user_id: int, cursor: PageCursor | None,
                                   limit: int | None) -> Sequence[NotificationTeacherToStudent]:
    notification = NotificationTeacherToStudent
    with DBsession.begin() as session:
        query = (
            _with_student_tries_join(select(notification))                                                              #
            .where(*_student_notifications_conditions(user_id))                                                         #
            .where(after_cursor(notification.creation_datetime, notification.id, 0, cursor))                            #
            .order_by(notification.creation_datetime.desc(), notification.id.desc()))
        if limit is not None:
            query = query.limit(limit)
        return session.scalars(query).all()


def get_student_unread_notifications_count(user_id: int) -> int:
    notification = NotificationTeacherToStudent
    with DBsession.begin() as session:
        return session.scalar(
            _with_student_tries_join(select(func.count(notification.id)).select_from(notification))                     #
            .where(*_student_notifications_conditions(user_id))                                                         #
            .where(notification.viewed == False)) or 0


def mark_all_teacher_notifications_as_read():
    notification = NotificationStudentToTeacher
    with DBsession.begin() as session:
        session.execute(
            update(notification).where(notification.deleted == False).where(notification.viewed == False).values(
                viewed=True))


def mark_all_student_notifications_as_read(user_id: int):
    notification = NotificationTeacherToStudent
    with DBsession.begin() as session:
        session.execute(
            update(notification)                                                                                        #
            .where(notification.deleted == False)                                                                       #
            .where(notification.viewed == False)                                                                        #
            .where(
                or_(
                    notification.student_id == user_id,
                    notification.assessment_try_id.in_(
                        select(AssessmentTry.id).where(AssessmentTry.user_id == user_id)),
                    notification.final_boss_try_id.in_(select(FinalBossTry.id).where(FinalBossTry.user_id == user_id)),
                ))                                                                                                      #
            .values(viewed=True))


#########################################################################################################################
################ Batch loaders ##########################################################################################
#########################################################################################################################
class ActivityTryDetails(TypedDict):
    activity_try: dict[str, Any]
    lesson: Lesson
    user: User


def get_activity_tries_details(try_ids_by_type: dict[str, set[int]]) -> dict[tuple[str, int], ActivityTryDetails]:
    """Попытка + урок + ученик для каждой (тип, id попытки) — один запрос на тип активности."""
    result: dict[tuple[str, int], ActivityTryDetails] = {}
    with DBsession.begin() as session:
        for try_type, try_ids in try_ids_by_type.items():
            if len(try_ids) == 0 or try_type not in ACTIVITY_TRY_MODELS:
                continue

            try_model, activity_model, has_checks = ACTIVITY_TRY_MODELS[try_type]
            rows = session.execute(
                select(try_model.id, try_model.base_id, try_model.start_datetime, try_model.end_datetime,
                       try_model.checked_tasks if has_checks else null(), Lesson, User)                                 #
                .join(activity_model, activity_model.id == try_model.base_id)                                           #
                .join(Lesson, Lesson.id == activity_model.lesson_id)                                                    #
                .join(User, User.id == try_model.user_id)                                                               #
                .where(try_model.id.in_(try_ids))).all()

            for try_id, base_id, start_datetime, end_datetime, checked_tasks, lesson, user in rows:
                mistakes_count = None
                if has_checks:
                    mistakes_count = sum(task.get("mistakes_count", 0) for task in json.loads(checked_tasks or "[]"))

                result[(try_type, try_id)] = {
                    "activity_try": {
                        "id": try_id,
                        "base_id": base_id,
                        "start_datetime": start_datetime,
                        "end_datetime": end_datetime,
                        "mistakes_count": mistakes_count,
                    },
                    "lesson": lesson,
                    "user": user,
                }

    return result


def get_homework_tries_details(try_ids: set[int]) -> dict[int, tuple[HomeworkTry, HomeworkAssignment, User]]:
    if len(try_ids) == 0:
        return {}

    with DBsession.begin() as session:
        rows = session.execute(
            select(HomeworkTry, HomeworkAssignment, User)                                                               #
            .join(HomeworkAssignment, HomeworkAssignment.id == HomeworkTry.assignment_id)                               #
            .join(User, User.id == HomeworkTry.student_id)                                                              #
            .where(HomeworkTry.id.in_(try_ids))).all()
        return {homework_try.id: (homework_try, assignment, user) for homework_try, assignment, user in rows}


def get_quizlet_assignment_results_details(
        result_ids: set[int]) -> dict[int, tuple[QuizletAssignmentResult, QuizletAssignment, User]]:
    if len(result_ids) == 0:
        return {}

    with DBsession.begin() as session:
        rows = session.execute(
            select(QuizletAssignmentResult, QuizletAssignment, User)                                                    #
            .join(QuizletAssignment, QuizletAssignment.id == QuizletAssignmentResult.assignment_id)                     #
            .join(User, User.id == QuizletAssignmentResult.student_id)                                                  #
            .where(QuizletAssignmentResult.id.in_(result_ids))).all()
        return {result.id: (result, assignment, user) for result, assignment, user in rows}


def get_quizlet_assignment_titles(assignment_ids: set[int]) -> dict[int, str]:
    if len(assignment_ids) == 0:
        return {}

    with DBsession.begin() as session:
        rows = session.execute(
            select(QuizletAssignment.id,
                   QuizletAssignment.title).where(QuizletAssignment.id.in_(assignment_ids))).all()
        return {assignment_id: title for assignment_id, title in rows}


def _titles_sorted(subgroups_by_id: dict[int, Any], subgroup_ids: list[int]) -> list[str]:
    subgroups = [subgroups_by_id[subgroup_id] for subgroup_id in subgroup_ids if subgroup_id in subgroups_by_id]
    return [subgroup.title for subgroup in sorted(subgroups, key=lambda subgroup: (subgroup.sort, subgroup.id))]


def get_quizlet_sessions_topic_titles(quizlet_sessions: Sequence[QuizletSession]) -> dict[int, list[str]]:
    """Названия тем для сессий Quizlet: выбранные в сессии разделы, а если их нет — разделы задания."""
    subgroup_ids = {subgroup_id for item in quizlet_sessions for subgroup_id in item.get_subgroup_ids()}
    user_subgroup_ids = {subgroup_id for item in quizlet_sessions for subgroup_id in item.get_user_subgroup_ids()}

    result: dict[int, list[str]] = {}
    with DBsession.begin() as session:
        subgroups_by_id = {
            subgroup.id: subgroup
            for subgroup in session.scalars(select(QuizletSubgroup).where(QuizletSubgroup.id.in_(subgroup_ids)))
        } if len(subgroup_ids) > 0 else {}
        user_subgroups_by_id = {
            subgroup.id: subgroup
            for subgroup in session.scalars(
                select(UserQuizletSubgroup).where(UserQuizletSubgroup.id.in_(user_subgroup_ids)))
        } if len(user_subgroup_ids) > 0 else {}

        fallback_sessions: list[QuizletSession] = []
        for item in quizlet_sessions:
            titles = _titles_sorted(subgroups_by_id, item.get_subgroup_ids())
            titles.extend(_titles_sorted(user_subgroups_by_id, item.get_user_subgroup_ids()))
            result[item.id] = list(dict.fromkeys(titles))
            if len(titles) == 0 and item.assignment_id is not None:
                fallback_sessions.append(item)

        if len(fallback_sessions) == 0:
            return result

        assignment_ids = {item.assignment_id for item in fallback_sessions}
        assignment_titles: dict[int, list[str]] = {}
        for assignment_id, subgroup in session.execute(
                select(QuizletAssignmentSubgroup.assignment_id, QuizletSubgroup)                                        #
                .join(QuizletSubgroup, QuizletSubgroup.id == QuizletAssignmentSubgroup.subgroup_id)                     #
                .where(QuizletAssignmentSubgroup.assignment_id.in_(assignment_ids))                                     #
                .order_by(QuizletSubgroup.sort, QuizletSubgroup.id)).all():
            assignment_titles.setdefault(assignment_id, []).append(subgroup.title)

        target_ids: dict[tuple[int, int], int] = {
            (assignment_id, student_id): target_id
            for target_id, assignment_id, student_id in session.execute(
                select(QuizletAssignmentTarget.id, QuizletAssignmentTarget.assignment_id,
                       QuizletAssignmentTarget.student_id)                                                              #
                .where(QuizletAssignmentTarget.assignment_id.in_(assignment_ids))                                       #
                .where(QuizletAssignmentTarget.student_id.in_({item.user_id
                                                               for item in fallback_sessions}))).all()
        }
        target_titles: dict[int, list[str]] = {}
        if len(target_ids) > 0:
            for target_id, subgroup in session.execute(
                    select(QuizletAssignmentTargetSubgroup.target_id, UserQuizletSubgroup)                              #
                    .join(UserQuizletSubgroup, UserQuizletSubgroup.id == QuizletAssignmentTargetSubgroup.subgroup_id)   #
                    .where(QuizletAssignmentTargetSubgroup.target_id.in_(set(target_ids.values())))                     #
                    .order_by(UserQuizletSubgroup.sort, UserQuizletSubgroup.id)).all():
                target_titles.setdefault(target_id, []).append(subgroup.title)

        for item in fallback_sessions:
            fallback_assignment_id = item.assignment_id or 0
            titles = list(assignment_titles.get(fallback_assignment_id, []))
            target_id = target_ids.get((fallback_assignment_id, item.user_id))
            if target_id is not None:
                titles.extend(target_titles.get(target_id, []))
            result[item.id] = list(dict.fromkeys(titles))

    return result


#########################################################################################################################
################ Teacher history ########################################################################################
#########################################################################################################################
# Ранги источников: при равном времени порядок такой же, как был до пагинации
# (уведомления, сессии Quizlet, словарь, разделы, правки словаря).
HISTORY_RANK_NOTIFICATION = 4
HISTORY_RANK_QUIZLET_SESSION = 3
HISTORY_RANK_PERSONAL_LESSON = 2
HISTORY_RANK_PERSONAL_SUBGROUP = 1
HISTORY_RANK_PERSONAL_DICTIONARY_EDIT = 0


@dataclass
class PersonalDictionaryEdit:
    subgroup_id: int
    subgroup_title: str
    lesson_title: str
    user_id: int
    created_at: datetime


@dataclass
class HistoryRow:
    cursor: PageCursor
    kind: str
    data: Any


def _history_notification_condition() -> ColumnElement[bool]:
    notification = NotificationStudentToTeacher
    return or_(
        notification.homework_try_id.isnot(None),
        and_(
            notification.quizlet_assignment_result_id.is_(None),
            or_(*[getattr(notification, f"{try_type}_id").isnot(None) for try_type in ACTIVITY_TRY_MODELS]),
        ),
    )


def _history_notification_student_condition(student_id: int) -> ColumnElement[bool]:
    notification = NotificationStudentToTeacher
    conditions = [
        notification.homework_try_id.in_(select(HomeworkTry.id).where(HomeworkTry.student_id == student_id)),
    ]
    for try_type, (try_model, _, _) in ACTIVITY_TRY_MODELS.items():
        conditions.append(
            getattr(notification, f"{try_type}_id").in_(select(try_model.id).where(try_model.user_id == student_id)))
    return or_(*conditions)


def _limit(query, limit: int | None):
    return query.limit(limit) if limit is not None else query


def get_history_rows(cursor: PageCursor | None, limit: int | None, student_id: int | None) -> list[HistoryRow]:
    """Первые `limit` событий истории после курсора (все события, если limit=None), по убыванию времени."""
    rows: list[HistoryRow] = []
    with DBsession.begin() as session:
        notification = NotificationStudentToTeacher
        query = (
            select(notification)                                                                                         #
            .where(notification.deleted == False)                                                                        #
            .where(_history_notification_condition())                                                                    #
            .where(after_cursor(notification.creation_datetime, notification.id, HISTORY_RANK_NOTIFICATION, cursor))     #
            .order_by(notification.creation_datetime.desc(), notification.id.desc()))
        if student_id is not None:
            query = query.where(_history_notification_student_condition(student_id))
        for item in session.scalars(_limit(query, limit)):
            rows.append(
                HistoryRow(PageCursor(sort_datetime=item.creation_datetime, rank=HISTORY_RANK_NOTIFICATION, id=item.id),
                           "notification", item))

        session_sort = func.coalesce(QuizletSession.ended_at, QuizletSession.started_at)
        sessions_query = (
            select(QuizletSession, session_sort)                                                                        #
            .options(defer(QuizletSession.queue_state))                                                                 #
            .join(User, User.id == QuizletSession.user_id)                                                              #
            .where(User.level == User.Level.STUDENT)                                                                    #
            .where(QuizletSession.is_finished == True)                                                                  #
            .where(after_cursor(session_sort, QuizletSession.id, HISTORY_RANK_QUIZLET_SESSION, cursor))                 #
            .order_by(session_sort.desc(), QuizletSession.id.desc()))
        if student_id is not None:
            sessions_query = sessions_query.where(QuizletSession.user_id == student_id)
        for item, sort_datetime in session.execute(_limit(sessions_query, limit)):
            rows.append(
                HistoryRow(PageCursor(sort_datetime=sort_datetime, rank=HISTORY_RANK_QUIZLET_SESSION, id=item.id),
                           "quizlet_session", item))

        lessons_query = (
            select(UserQuizletLesson)                                                                                    #
            .join(User, User.id == UserQuizletLesson.user_id)                                                            #
            .where(User.level == User.Level.STUDENT)                                                                     #
            .where(
                after_cursor(UserQuizletLesson.created_at, UserQuizletLesson.id, HISTORY_RANK_PERSONAL_LESSON, cursor))  #
            .order_by(UserQuizletLesson.created_at.desc(), UserQuizletLesson.id.desc()))
        if student_id is not None:
            lessons_query = lessons_query.where(UserQuizletLesson.user_id == student_id)
        for lesson in session.scalars(_limit(lessons_query, limit)):
            rows.append(
                HistoryRow(PageCursor(sort_datetime=lesson.created_at, rank=HISTORY_RANK_PERSONAL_LESSON, id=lesson.id),
                           "personal_lesson", lesson))

        subgroups_query = (
            select(UserQuizletSubgroup, UserQuizletLesson)                                                              #
            .join(UserQuizletLesson, UserQuizletLesson.id == UserQuizletSubgroup.lesson_id)                             #
            .join(User, User.id == UserQuizletLesson.user_id)                                                           #
            .where(User.level == User.Level.STUDENT)                                                                    #
            .where(
                after_cursor(UserQuizletSubgroup.created_at, UserQuizletSubgroup.id, HISTORY_RANK_PERSONAL_SUBGROUP,
                             cursor))                                                                                   #
            .order_by(UserQuizletSubgroup.created_at.desc(), UserQuizletSubgroup.id.desc()))
        if student_id is not None:
            subgroups_query = subgroups_query.where(UserQuizletLesson.user_id == student_id)
        for subgroup, subgroup_lesson in session.execute(_limit(subgroups_query, limit)):
            rows.append(
                HistoryRow(
                    PageCursor(sort_datetime=subgroup.created_at, rank=HISTORY_RANK_PERSONAL_SUBGROUP, id=subgroup.id),
                    "personal_subgroup", (subgroup, subgroup_lesson)))

        # Правка словаря = слова, добавленные в раздел в одну и ту же секунду.
        edits_query = (
            select(UserQuizletWord.subgroup_id, UserQuizletWord.created_at, UserQuizletSubgroup.title,
                   UserQuizletLesson.title, UserQuizletLesson.user_id)                                                  #
            .join(UserQuizletSubgroup, UserQuizletSubgroup.id == UserQuizletWord.subgroup_id)                           #
            .join(UserQuizletLesson, UserQuizletLesson.id == UserQuizletSubgroup.lesson_id)                             #
            .join(User, User.id == UserQuizletLesson.user_id)                                                           #
            .where(User.level == User.Level.STUDENT)                                                                    #
            .where(
                after_cursor(UserQuizletWord.created_at, UserQuizletWord.subgroup_id,
                             HISTORY_RANK_PERSONAL_DICTIONARY_EDIT, cursor))                                            #
            .group_by(UserQuizletWord.subgroup_id, UserQuizletWord.created_at, UserQuizletSubgroup.title,
                      UserQuizletLesson.title, UserQuizletLesson.user_id)                                               #
            .order_by(UserQuizletWord.created_at.desc(), UserQuizletWord.subgroup_id.desc()))
        if student_id is not None:
            edits_query = edits_query.where(UserQuizletLesson.user_id == student_id)
        for subgroup_id, created_at, subgroup_title, lesson_title, user_id in session.execute(_limit(
                edits_query, limit)):
            rows.append(
                HistoryRow(
                    PageCursor(sort_datetime=created_at, rank=HISTORY_RANK_PERSONAL_DICTIONARY_EDIT, id=subgroup_id),
                    "personal_dictionary_edit",
                    PersonalDictionaryEdit(subgroup_id, subgroup_title, lesson_title, user_id, created_at)))

    rows.sort(key=lambda row: row.cursor.key(), reverse=True)
    return rows[:limit] if limit is not None else rows


def get_history_actions_count_by_student() -> dict[int, int]:
    """Количество событий истории по ученикам — агрегатами, без загрузки самих событий."""
    counts: dict[int, int] = {}

    def add(rows):
        for user_id, count in rows:
            counts[user_id] = counts.get(user_id, 0) + count

    notification = NotificationStudentToTeacher
    with DBsession.begin() as session:
        for try_type, (try_model, _, _) in ACTIVITY_TRY_MODELS.items():
            add(
                session.execute(
                    select(try_model.user_id, func.count(notification.id))                                              #
                    .join(try_model, try_model.id == getattr(notification, f"{try_type}_id"))                           #
                    .where(notification.deleted == False)                                                               #
                    .where(notification.homework_try_id.is_(None))                                                      #
                    .where(notification.quizlet_assignment_result_id.is_(None))                                         #
                    .group_by(try_model.user_id)).all())

        add(
            session.execute(
                select(HomeworkTry.student_id, func.count(notification.id))                                             #
                .join(HomeworkTry, HomeworkTry.id == notification.homework_try_id)                                      #
                .where(notification.deleted == False)                                                                   #
                .where(HomeworkTry.end_datetime.isnot(None))                                                            #
                .group_by(HomeworkTry.student_id)).all())

        add(
            session.execute(
                select(QuizletSession.user_id, func.count(QuizletSession.id))                                           #
                .where(QuizletSession.is_finished == True)                                                              #
                .group_by(QuizletSession.user_id)).all())

        add(
            session.execute(
                select(UserQuizletLesson.user_id, func.count(UserQuizletLesson.id))                                     #
                .group_by(UserQuizletLesson.user_id)).all())

        add(
            session.execute(
                select(UserQuizletLesson.user_id, func.count(UserQuizletSubgroup.id))                                   #
                .join(UserQuizletLesson, UserQuizletLesson.id == UserQuizletSubgroup.lesson_id)                         #
                .group_by(UserQuizletLesson.user_id)).all())

        dictionary_edits = (
            select(UserQuizletLesson.user_id, UserQuizletWord.subgroup_id, UserQuizletWord.created_at)                  #
            .join(UserQuizletSubgroup, UserQuizletSubgroup.id == UserQuizletWord.subgroup_id)                           #
            .join(UserQuizletLesson, UserQuizletLesson.id == UserQuizletSubgroup.lesson_id)                             #
            .distinct()                                                                                                 #
            .subquery())
        add(
            session.execute(
                select(dictionary_edits.c.user_id, func.count())                                                        #
                .select_from(dictionary_edits)                                                                          #
                .group_by(dictionary_edits.c.user_id)).all())

    return counts
