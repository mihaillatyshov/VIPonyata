from datetime import datetime
import json
import random
from typing import Generic, Literal, TypedDict

from sqlalchemy import delete, literal, select, union_all, update
from sqlalchemy.sql.expression import func

from server.common import DBsession
from server.exceptions.ApiExceptions import (ActivityNotFoundException, CourseNotFoundException, InvalidAPIUsage,
                                             LessonNotFoundException)
from server.log_lib import LogI
from server.models.db_models import (
    ActivityTryType, ActivityType, Assessment, AssessmentTry, AssessmentTryType, AssessmentType, Course, Dictionary,
    Drilling, DrillingCard, DrillingTry, FinalBoss, FinalBossTry, Hieroglyph, HieroglyphCard, HieroglyphTry, Lesson,
    LexisCardType, LexisTryType, LexisType, NotificationStudentToTeacher, NotificationTeacherToStudent,
    QuizletDictionary, QuizletGroup, QuizletSession, QuizletSessionIncorrectWord, QuizletSessionWord, QuizletSubgroup,
    QuizletSubgroupWord, User, UserDictionary, UserQuizletLesson, UserQuizletSubgroup, UserQuizletWord)
from server.models.dictionary import DictionaryAssociationReq, DictionaryImgReq
from server.models.quizlet import (QuizletEndSessionReq, QuizletFlashcardAnswerReq, QuizletPersonalLessonCreateReq,
                                   QuizletRetryIncorrectReq, QuizletSaveProgressReq, QuizletStartSessionReq,
                                   QuizletSubgroupCreateReq, QuizletWordCreateReq, QuizletWordUpdateReq)

QUIZLET_SESSION_MAX_WORDS = 100


#########################################################################################################################
################ Course and Lesson ######################################################################################
#########################################################################################################################
def get_available_courses(user_id: int) -> list[Course]:
    with DBsession.begin() as session:
        return session.scalars(
            select(Course).join(Course.users).where(User.id == user_id).order_by(Course.sort).order_by(
                Course.id)).all()


def get_course_by_id_new(course_id: int, user_id: int) -> Course | None:
    with DBsession.begin() as session:
        return session.scalars(
            select(Course).where(Course.id == course_id).join(Course.users).where(User.id == user_id)).one_or_none()


def get_course_by_id(course_id: int, user_id: int) -> Course:
    with DBsession.begin() as session:
        course = session.scalars(
            select(Course).where(Course.id == course_id).join(Course.users).where(User.id == user_id)).one_or_none()

        # TODO move code after to Upper Layer
        if course is not None:
            return course

        if session.scalars(select(Course).where(Course.id == course_id)).one_or_none():
            raise InvalidAPIUsage("You do not have access to this course!", 403)

        raise CourseNotFoundException(course_id)


def get_lessons_by_course_id(course_id: int, user_id: int) -> list[Lesson]:
    with DBsession.begin() as session:
        return session.scalars(
            select(Lesson).where(Lesson.course_id == course_id).join(Lesson.users).where(User.id == user_id).order_by(
                Lesson.number).order_by(Lesson.id)).all()


def get_lesson_by_id_new(lesson_id: int, user_id: int) -> Lesson | None:
    with DBsession.begin() as session:
        return session.scalars(
            select(Lesson).where(Lesson.id == lesson_id).join(Lesson.users).where(User.id == user_id)).one_or_none()


def get_lesson_by_id(lesson_id: int, user_id: int) -> Lesson:
    with DBsession.begin() as session:
        lesson = session.scalars(
            select(Lesson).where(Lesson.id == lesson_id).join(Lesson.users).where(User.id == user_id)).one_or_none()

        # TODO move code after to Upper Layer
        if lesson is not None:
            return lesson

        lesson = session.scalars(select(Lesson).where(Lesson.id == lesson_id)).one_or_none()

        if lesson is not None:
            raise InvalidAPIUsage("You do not have access to this lesson!", 403, {"course_id": lesson.course_id})

        raise LessonNotFoundException(lesson_id)


#########################################################################################################################
################ Activity ###############################################################################################
#########################################################################################################################
class ActivityForNotificationType(TypedDict):
    id: int
    lesson_id: int


class ActivityTryForNotificationType(TypedDict):
    id: int
    base_id: int
    start_datetime: datetime
    end_datetime: datetime
    mistakes_count: int | None


class UnfinishedLessonsSummaryType(TypedDict):
    has_unfinished_lessons: bool
    unfinished_lessons_count: int
    next_unfinished_course_name: str | None
    next_unfinished_lesson_id: int | None
    next_unfinished_lesson_name: str | None
    next_unfinished_activity_type: Literal["drilling", "hieroglyph", "assessment"] | None
    next_unfinished_activity_id: int | None
    next_unfinished_activity_started_at: datetime | None
    items: list["UnfinishedLessonItemType"]


class UnfinishedLessonItemType(TypedDict):
    course_name: str
    lesson_id: int
    lesson_name: str
    activity_type: Literal["drilling", "hieroglyph", "assessment"]
    activity_id: int
    activity_started_at: datetime


def _unfinished_lesson_ids_subquery(user_id: int):
    drilling_unfinished = select(Drilling.lesson_id.label("lesson_id")).join(
        DrillingTry, DrillingTry.base_id == Drilling.id).where(DrillingTry.user_id == user_id).where(
            DrillingTry.end_datetime == None)

    hieroglyph_unfinished = select(Hieroglyph.lesson_id.label("lesson_id")).join(
        HieroglyphTry, HieroglyphTry.base_id == Hieroglyph.id).where(HieroglyphTry.user_id == user_id).where(
            HieroglyphTry.end_datetime == None)

    assessment_unfinished = select(Assessment.lesson_id.label("lesson_id")).join(
        AssessmentTry, AssessmentTry.base_id == Assessment.id).where(AssessmentTry.user_id == user_id).where(
            AssessmentTry.end_datetime == None)

    return union_all(drilling_unfinished, hieroglyph_unfinished, assessment_unfinished).subquery()


def _unfinished_activities_subquery(user_id: int):
    drilling_unfinished = select(Drilling.lesson_id.label("lesson_id"), Drilling.id.label("activity_id"),
                                 DrillingTry.start_datetime.label("started_at"),
                                 literal("drilling").label("activity_type")).join(
                                     DrillingTry, DrillingTry.base_id == Drilling.id).where(
                                         DrillingTry.user_id == user_id).where(DrillingTry.end_datetime == None)

    hieroglyph_unfinished = select(Hieroglyph.lesson_id.label("lesson_id"), Hieroglyph.id.label("activity_id"),
                                   HieroglyphTry.start_datetime.label("started_at"),
                                   literal("hieroglyph").label("activity_type")).join(
                                       HieroglyphTry, HieroglyphTry.base_id == Hieroglyph.id).where(
                                           HieroglyphTry.user_id == user_id).where(HieroglyphTry.end_datetime == None)

    assessment_unfinished = select(Assessment.lesson_id.label("lesson_id"), Assessment.id.label("activity_id"),
                                   AssessmentTry.start_datetime.label("started_at"),
                                   literal("assessment").label("activity_type")).join(
                                       AssessmentTry, AssessmentTry.base_id == Assessment.id).where(
                                           AssessmentTry.user_id == user_id).where(AssessmentTry.end_datetime == None)

    return union_all(drilling_unfinished, hieroglyph_unfinished, assessment_unfinished).subquery()


def _build_unfinished_lessons_summary(user_id: int, course_id: int | None = None) -> UnfinishedLessonsSummaryType:
    with DBsession.begin() as session:
        unfinished_lesson_ids_subquery = _unfinished_lesson_ids_subquery(user_id)
        unfinished_lesson_ids = select(unfinished_lesson_ids_subquery.c.lesson_id).distinct()

        lessons_query = select(Lesson.id, Lesson.name,
                               Course.name).join(Lesson.course).join(Lesson.users).where(User.id == user_id).where(
                                   Lesson.id.in_(unfinished_lesson_ids))
        if course_id is not None:
            lessons_query = lessons_query.where(Lesson.course_id == course_id)

        unfinished_lessons = session.execute(lessons_query.order_by(Lesson.number).order_by(Lesson.id)).all()
        if not unfinished_lessons:
            return {
                "has_unfinished_lessons": False,
                "unfinished_lessons_count": 0,
                "next_unfinished_course_name": None,
                "next_unfinished_lesson_id": None,
                "next_unfinished_lesson_name": None,
                "next_unfinished_activity_type": None,
                "next_unfinished_activity_id": None,
                "next_unfinished_activity_started_at": None,
                "items": [],
            }

        unfinished_activities_subquery = _unfinished_activities_subquery(user_id)
        next_activity_query = select(
            unfinished_activities_subquery.c.activity_type,
            unfinished_activities_subquery.c.activity_id,
            unfinished_activities_subquery.c.started_at,
            Course.name,
            Lesson.id,
            Lesson.name,
        ).join(Lesson, Lesson.id == unfinished_activities_subquery.c.lesson_id).join(Lesson.course).join(
            Lesson.users).where(User.id == user_id)
        if course_id is not None:
            next_activity_query = next_activity_query.where(Lesson.course_id == course_id)

        all_activities = session.execute(
            next_activity_query.order_by(unfinished_activities_subquery.c.started_at.desc(), Lesson.number,
                                         Lesson.id)).all()

        unique_lessons_items: list[UnfinishedLessonItemType] = []
        used_lessons: set[int] = set()
        for activity in all_activities:
            lesson_id = activity[4]
            if lesson_id in used_lessons:
                continue

            used_lessons.add(lesson_id)
            unique_lessons_items.append({
                "course_name": activity[3],
                "lesson_id": lesson_id,
                "lesson_name": activity[5],
                "activity_type": activity[0],
                "activity_id": activity[1],
                "activity_started_at": activity[2],
            })

        next_activity = unique_lessons_items[0] if unique_lessons_items else None

        next_lesson_id, next_lesson_name, next_course_name = unfinished_lessons[0]
        if next_activity is not None:
            return {
                "has_unfinished_lessons": True,
                "unfinished_lessons_count": len(unique_lessons_items),
                "next_unfinished_course_name": next_activity["course_name"],
                "next_unfinished_lesson_id": next_activity["lesson_id"],
                "next_unfinished_lesson_name": next_activity["lesson_name"],
                "next_unfinished_activity_type": next_activity["activity_type"],
                "next_unfinished_activity_id": next_activity["activity_id"],
                "next_unfinished_activity_started_at": next_activity["activity_started_at"],
                "items": unique_lessons_items,
            }

        return {
            "has_unfinished_lessons": True,
            "unfinished_lessons_count": len(unfinished_lessons),
            "next_unfinished_course_name": next_course_name,
            "next_unfinished_lesson_id": next_lesson_id,
            "next_unfinished_lesson_name": next_lesson_name,
            "next_unfinished_activity_type": None,
            "next_unfinished_activity_id": None,
            "next_unfinished_activity_started_at": None,
            "items": [],
        }


def get_unfinished_lessons_summary_by_course_id(course_id: int, user_id: int) -> UnfinishedLessonsSummaryType:
    return _build_unfinished_lessons_summary(user_id=user_id, course_id=course_id)


def get_unfinished_lessons_summary(user_id: int) -> UnfinishedLessonsSummaryType:
    return _build_unfinished_lessons_summary(user_id=user_id)


def finish_unfinished_activity(user_id: int, activity_type: str, activity_id: int) -> None:
    activity_queries_by_type: dict[str, ActivityQueries] = {
        "drilling": DrillingQueries,
        "hieroglyph": HieroglyphQueries,
        "assessment": AssessmentQueries,
    }
    activity_queries = activity_queries_by_type.get(activity_type)
    if activity_queries is None:
        raise InvalidAPIUsage("Unsupported activity type", 400)

    activity_try = activity_queries.get_unfinished_try_by_activity_id(activity_id, user_id)
    activity_try_type = getattr(activity_queries, "_activity_try_type")
    with DBsession.begin() as session:
        session.execute(
            update(activity_try_type).where(activity_try_type.id == activity_try.id).values(
                end_datetime=datetime.now()))


class ActivityQueries(Generic[ActivityType, ActivityTryType]):
    _activity_type: type[ActivityType]
    _activity_try_type: type[ActivityTryType]

    def __init__(self, activity_type: type[ActivityType], activity_try_type: type[ActivityTryType]):
        self._activity_type = activity_type
        self._activity_try_type = activity_try_type

    def get_by_lesson_id(self, lesson_id: int, user_id: int) -> ActivityType | None:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activity_type).join(self._activity_type.lesson).where(Lesson.id == lesson_id).join(
                    Lesson.users).where(User.id == user_id)).one_or_none()

    def get_by_id_new(self, activity_id: int, user_id: int) -> ActivityType | None:
        with DBsession.begin() as session:
            return session.scalars(                                                                                     #
                select(self._activity_type)                                                                             #
                .where(self._activity_type.id == activity_id)                                                           #
                .join(self._activity_type.lesson)                                                                       #
                .join(Lesson.users)                                                                                     #
                .where(User.id == user_id)                                                                              #
            ).one_or_none()

    def get_for_notifications_by_id(self, activity_id: int, user_id: int) -> ActivityForNotificationType | None:
        with DBsession.begin() as session:
            result = session.execute(                                                                                   #
                select(self._activity_type.id, self._activity_type.lesson_id)                                           #
                .where(self._activity_type.id == activity_id)                                                           #
                .join(self._activity_type.lesson)                                                                       #
                .join(Lesson.users)                                                                                     #
                .where(User.id == user_id)                                                                              #
            ).one_or_none()

            if result is None:
                return None

            return {"id": result[0], "lesson_id": result[1]}

    def get_by_id(self, activity_id: int, user_id: int) -> ActivityType:
        with DBsession.begin() as session:
            activity = session.scalars(
                select(self._activity_type).where(self._activity_type.id == activity_id).join(
                    self._activity_type.lesson).join(Lesson.users).where(User.id == user_id)).one_or_none()

            # TODO move code after to Upper Layer
            if activity is not None:
                return activity

            activity = session.scalars(select(
                self._activity_type).where(self._activity_type.id == activity_id)).one_or_none()

            if activity is not None:
                raise InvalidAPIUsage(f"You do not have access to this {self._activity_type.__name__}!", 403,
                                      {"lesson_id": activity.lesson_id})

            raise ActivityNotFoundException(self._activity_type.__name__)

    def get_tries_by_activity_id(self, activity_id: int, user_id: int) -> list[ActivityTryType]:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activity_try_type).where(self._activity_try_type.user_id == user_id).join(
                    self._activity_try_type.base).where(self._activity_type.id == activity_id).order_by(
                        self._activity_try_type.try_number)).all()

    def get_unfinished_try_by_activity_id(self, activity_id: int, user_id: int) -> ActivityTryType:
        with DBsession.begin() as session:
            activity_try = session.scalars(
                select(self._activity_try_type).where(self._activity_try_type.end_datetime == None).where(
                    self._activity_try_type.user_id == user_id).join(
                        self._activity_try_type.base).where(self._activity_type.id == activity_id)).one_or_none()

            # TODO move code after to Upper Layer
            if activity_try is not None:
                return activity_try

            activity = session.scalars(select(
                self._activity_type).where(self._activity_type.id == activity_id)).one_or_none()

            if activity_try is not None:
                raise InvalidAPIUsage(f"{self._activity_type.__name__} not started!", 403,
                                      {"lesson_id": activity.lesson_id})

            raise ActivityNotFoundException(self._activity_type.__name__)


#########################################################################################################################
################ Lexis ##################################################################################################
#########################################################################################################################
class LexisQueries(ActivityQueries[LexisType, LexisTryType], Generic[LexisType, LexisTryType, LexisCardType]):
    _lexis_card_type: type[LexisCardType]

    def __init__(self, lexis_type: type[LexisType], lexis_try_type: type[LexisTryType],
                 lexis_card_type: type[LexisCardType]):
        super().__init__(lexis_type, lexis_try_type)
        self._lexis_card_type = lexis_card_type

    def add_new_try(self, try_number: int, activity_id: int, user_id: int) -> LexisTryType:
        with DBsession.begin() as session:
            new_activity_try = self._activity_try_type(try_number=try_number,
                                                       start_datetime=datetime.now(),
                                                       user_id=user_id,
                                                       base_id=activity_id)
            session.add(new_activity_try)
            return new_activity_try

    def set_done_tasks_in_try(self, activity_try_id: int, done_tasks: str) -> None:
        with DBsession.begin() as session:
            session.execute(
                update(self._activity_try_type).where(self._activity_try_type.id == activity_try_id).values(
                    done_tasks=done_tasks))

    def get_cards_by_activity_id(self, activity_id: int) -> list[LexisCardType]:
        with DBsession.begin() as session:
            return session.scalars(select(
                self._lexis_card_type).where(self._lexis_card_type.base_id == activity_id)).all()


#########################################################################################################################
################ Drilling and Hieroglyph ################################################################################
#########################################################################################################################
DrillingQueries = LexisQueries(Drilling, DrillingTry, DrillingCard)
HieroglyphQueries = LexisQueries(Hieroglyph, HieroglyphTry, HieroglyphCard)


#########################################################################################################################
################ Assessment #############################################################################################
#########################################################################################################################
class AssessmentQueriesClass(ActivityQueries[AssessmentType, AssessmentTryType]):
    def add_assessment_new_try(self,
                               try_number: int,
                               activity_id: int,
                               user_id: int,
                               tasks: str = "",
                               checked_tasks: str = "") -> AssessmentTryType | None:
        with DBsession.begin() as session:
            new_activity_try = self._activity_try_type(try_number=try_number,
                                                       start_datetime=datetime.now(),
                                                       user_id=user_id,
                                                       done_tasks=tasks,
                                                       checked_tasks=checked_tasks,
                                                       base_id=activity_id)
            session.add(new_activity_try)
            return new_activity_try

    def add_done_and_check_tasks(self, activity_try_id: int, done_tasks, checked_tasks):
        with DBsession.begin() as session:
            session.execute(
                update(self._activity_try_type).where(self._activity_try_type.id == activity_try_id).values(
                    done_tasks=done_tasks, checked_tasks=checked_tasks))

    def get_done_tries_by_activity_id(self, activity_id: int, user_id: int) -> list[AssessmentTryType]:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activity_try_type).where(self._activity_try_type.end_datetime != None).where(
                    self._activity_try_type.user_id == user_id).join(
                        self._activity_try_type.base).where(self._activity_type.id == activity_id).order_by(
                            self._activity_try_type.try_number.desc())).all()

    def get_done_try_by_id(self, activity_try_id: int, user_id: int) -> AssessmentTryType:
        with DBsession.begin() as session:
            return session.scalars(
                select(self._activity_try_type)                                                                         #
                .where(self._activity_try_type.id == activity_try_id)                                                   #
                .where(self._activity_try_type.end_datetime != None)                                                    #
                .where(self._activity_try_type.user_id == user_id)                                                      #
            ).one_or_none()

    def get_done_try_for_notifications_by_id(self, activity_try_id: int,
                                             user_id: int) -> ActivityTryForNotificationType | None:
        with DBsession.begin() as session:
            result = session.execute(                                                                                   #
                select(self._activity_try_type.id, self._activity_try_type.base_id,
                       self._activity_try_type.start_datetime, self._activity_try_type.end_datetime,
                       self._activity_try_type.checked_tasks)                                                           #
                .where(self._activity_try_type.id == activity_try_id)                                                   #
                .where(self._activity_try_type.end_datetime != None)                                                    #
                .where(self._activity_try_type.user_id == user_id)                                                      #
            ).one_or_none()

            if result is None:
                return None

            checked_tasks = json.loads(result[4] or "[]")
            mistakes_count = sum(task.get("mistakes_count", 0) for task in checked_tasks)
            return {
                "id": result[0],
                "base_id": result[1],
                "start_datetime": result[2],
                "end_datetime": result[3],
                "mistakes_count": mistakes_count
            }

    def get_viewed_notifications_by_try_ids(self, activity_try_ids: list[int]) -> set[int]:
        if len(activity_try_ids) == 0:
            return set()

        with DBsession.begin() as session:
            if self._activity_try_type == AssessmentTry:
                result = session.scalars(
                    select(NotificationStudentToTeacher.assessment_try_id).where(
                        NotificationStudentToTeacher.assessment_try_id.in_(activity_try_ids)).where(
                            NotificationStudentToTeacher.viewed == True)).all()
            elif self._activity_try_type == FinalBossTry:
                result = session.scalars(
                    select(NotificationStudentToTeacher.final_boss_try_id).where(
                        NotificationStudentToTeacher.final_boss_try_id.in_(activity_try_ids)).where(
                            NotificationStudentToTeacher.viewed == True)).all()
            else:
                result = []

            return set(try_id for try_id in result if try_id is not None)


AssessmentQueries = AssessmentQueriesClass[Assessment, AssessmentTry](Assessment, AssessmentTry)
FinalBossQueries = AssessmentQueriesClass[FinalBoss, FinalBossTry](FinalBoss, FinalBossTry)


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
def add_user_dictionary_if_not_exists(dictionary_id: int, user_id: int) -> UserDictionary:
    with DBsession.begin() as session:
        dictinary = session.scalars(
            select(UserDictionary).where(UserDictionary.dictionary_id == dictionary_id).where(
                UserDictionary.user_id == user_id)).one_or_none()

        if dictinary is None:
            dictinary = UserDictionary(user_id=user_id, dictionary_id=dictionary_id)
            session.add(dictinary)

        return dictinary


def get_ditcionary_item(dictionary_id: int, user_id: int) -> tuple[Dictionary, UserDictionary]:
    with DBsession.begin() as session:
        result = session.execute(
            select(Dictionary, UserDictionary).join(UserDictionary.dictionary).where(
                Dictionary.id == dictionary_id).where(UserDictionary.user_id == user_id)).one_or_none()
        return result


def get_dictionary(user_id: int) -> list[tuple[Dictionary, UserDictionary]]:
    with DBsession.begin() as session:
        return session.execute(
            select(Dictionary,
                   UserDictionary).join(UserDictionary.dictionary).where(UserDictionary.user_id == user_id)).all()


def add_img_to_dictionary(dictionary_img_req: DictionaryImgReq, user_id: int):
    dictionary_item = add_user_dictionary_if_not_exists(dictionary_img_req.dictionary_id, user_id)

    with DBsession.begin() as session:
        session.execute(
            update(UserDictionary).where(UserDictionary.id == dictionary_item.id).values(img=dictionary_img_req.url))


def add_association_to_dictionary(dictionary_association_req: DictionaryAssociationReq, user_id: int):
    dictionary_item = add_user_dictionary_if_not_exists(dictionary_association_req.dictionary_id, user_id)

    with DBsession.begin() as session:
        session.execute(
            update(UserDictionary).where(UserDictionary.id == dictionary_item.id).values(
                association=dictionary_association_req.association))


def get_dictionary_count(user_id: int) -> int:
    with DBsession.begin() as session:
        return session.scalar(select(func.count()).select_from(UserDictionary).where(UserDictionary.user_id == user_id))


#########################################################################################################################
################ Quizlet ################################################################################################
#########################################################################################################################
def _dump_queue(queue: list[int]) -> str:
    return json.dumps(queue, ensure_ascii=False)


def _load_queue(queue_data: str) -> list[int]:
    try:
        parsed = json.loads(queue_data)
        if isinstance(parsed, list):
            return [int(item) for item in parsed]
    except (json.JSONDecodeError, TypeError, ValueError):
        return []

    return []


def _ensure_char(word_char_jp: str | None, word_jp: str) -> str:
    return word_char_jp if word_char_jp is not None and word_char_jp != "" else word_jp


def get_quizlet_groups() -> list[QuizletGroup]:
    with DBsession.begin() as session:
        return session.scalars(select(QuizletGroup).order_by(QuizletGroup.sort).order_by(QuizletGroup.id)).all()


def get_quizlet_subgroups(group_ids: list[int]) -> list[QuizletSubgroup]:
    if len(group_ids) == 0:
        return []

    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletSubgroup).where(QuizletSubgroup.group_id.in_(group_ids)).order_by(
                QuizletSubgroup.sort).order_by(QuizletSubgroup.id)).all()


def get_quizlet_words(subgroup_ids: list[int]) -> list[tuple[QuizletSubgroupWord, QuizletDictionary]]:
    if len(subgroup_ids) == 0:
        return []

    with DBsession.begin() as session:
        return session.execute(
            select(QuizletSubgroupWord, QuizletDictionary).join(QuizletSubgroupWord.word).where(
                QuizletSubgroupWord.subgroup_id.in_(subgroup_ids))).all()


def get_personal_quizlet_lesson(user_id: int) -> UserQuizletLesson | None:
    with DBsession.begin() as session:
        return session.scalars(select(UserQuizletLesson).where(UserQuizletLesson.user_id == user_id)).one_or_none()


def create_personal_quizlet_lesson(user_id: int, data: QuizletPersonalLessonCreateReq) -> UserQuizletLesson:
    with DBsession.begin() as session:
        exists = session.scalars(select(UserQuizletLesson).where(UserQuizletLesson.user_id == user_id)).one_or_none()
        if exists is not None:
            raise InvalidAPIUsage("You already have a personal quizlet lesson", 400)

        lesson = UserQuizletLesson(user_id=user_id, title=data.title)
        session.add(lesson)
        return lesson


def update_personal_quizlet_lesson(user_id: int, data: QuizletPersonalLessonCreateReq):
    with DBsession.begin() as session:
        lesson = session.scalars(select(UserQuizletLesson).where(UserQuizletLesson.user_id == user_id)).one_or_none()
        if lesson is None:
            raise InvalidAPIUsage("Personal quizlet lesson not found", 404)
        lesson.title = data.title


def _get_personal_subgroup(subgroup_id: int, user_id: int) -> UserQuizletSubgroup:
    with DBsession.begin() as session:
        subgroup = session.scalars(
            select(UserQuizletSubgroup).join(UserQuizletSubgroup.lesson).where(
                UserQuizletSubgroup.id == subgroup_id).where(UserQuizletLesson.user_id == user_id)).one_or_none()
        if subgroup is None:
            raise InvalidAPIUsage("Personal subgroup not found", 404)
        return subgroup


def get_personal_quizlet_subgroups(user_id: int) -> list[UserQuizletSubgroup]:
    with DBsession.begin() as session:
        return session.scalars(
            select(UserQuizletSubgroup).join(
                UserQuizletSubgroup.lesson).where(UserQuizletLesson.user_id == user_id).order_by(
                    UserQuizletSubgroup.sort).order_by(UserQuizletSubgroup.id)).all()


def create_personal_quizlet_subgroup(user_id: int, data: QuizletSubgroupCreateReq) -> UserQuizletSubgroup:
    with DBsession.begin() as session:
        lesson = session.scalars(select(UserQuizletLesson).where(UserQuizletLesson.user_id == user_id)).one_or_none()
        if lesson is None:
            raise InvalidAPIUsage("Create personal lesson first", 400)

        subgroup = UserQuizletSubgroup(lesson_id=lesson.id, title=data.title, sort=data.sort)
        session.add(subgroup)
        return subgroup


def update_personal_quizlet_subgroup(user_id: int, subgroup_id: int, data: QuizletSubgroupCreateReq):
    subgroup = _get_personal_subgroup(subgroup_id, user_id)
    with DBsession.begin() as session:
        session.execute(
            update(UserQuizletSubgroup).where(UserQuizletSubgroup.id == subgroup.id).values(**data.model_dump()))


def delete_personal_quizlet_subgroup(user_id: int, subgroup_id: int):
    subgroup = _get_personal_subgroup(subgroup_id, user_id)
    with DBsession.begin() as session:
        session.execute(delete(UserQuizletWord).where(UserQuizletWord.subgroup_id == subgroup.id))
        session.execute(delete(UserQuizletSubgroup).where(UserQuizletSubgroup.id == subgroup.id))


def get_personal_quizlet_words(user_id: int) -> list[UserQuizletWord]:
    with DBsession.begin() as session:
        return session.scalars(
            select(UserQuizletWord).join(UserQuizletWord.subgroup).join(UserQuizletSubgroup.lesson).where(
                UserQuizletLesson.user_id == user_id).order_by(UserQuizletWord.id)).all()


def add_personal_quizlet_word(user_id: int, data: QuizletWordCreateReq) -> UserQuizletWord:
    subgroup = _get_personal_subgroup(data.subgroup_id, user_id)

    with DBsession.begin() as session:
        word = UserQuizletWord(subgroup_id=subgroup.id,
                               ru=data.ru,
                               word_jp=data.word_jp,
                               char_jp=data.char_jp,
                               img=data.img)
        session.add(word)
        return word


def update_personal_quizlet_word(user_id: int, word_id: int, data: QuizletWordUpdateReq):
    with DBsession.begin() as session:
        word = session.scalars(
            select(UserQuizletWord).join(UserQuizletWord.subgroup).join(UserQuizletSubgroup.lesson).where(
                UserQuizletLesson.user_id == user_id).where(UserQuizletWord.id == word_id)).one_or_none()
        if word is None:
            raise InvalidAPIUsage("Personal word not found", 404)

        session.execute(update(UserQuizletWord).where(UserQuizletWord.id == word.id).values(**data.model_dump()))


def delete_personal_quizlet_word(user_id: int, word_id: int):
    with DBsession.begin() as session:
        word = session.scalars(
            select(UserQuizletWord).join(UserQuizletWord.subgroup).join(UserQuizletSubgroup.lesson).where(
                UserQuizletLesson.user_id == user_id).where(UserQuizletWord.id == word_id)).one_or_none()
        if word is None:
            raise InvalidAPIUsage("Personal word not found", 404)

        session.execute(delete(UserQuizletWord).where(UserQuizletWord.id == word.id))


def _collect_words_for_session(
        session, user_id: int,
        start_data: QuizletStartSessionReq) -> list[tuple[str, int, str | None, str, str, str | None]]:
    result: list[tuple[str, int, str | None, str, str, str | None]] = []

    if len(start_data.subgroup_ids) > 0:
        teacher_words = session.execute(
            select(QuizletSubgroupWord, QuizletDictionary).join(QuizletSubgroupWord.word).where(
                QuizletSubgroupWord.subgroup_id.in_(start_data.subgroup_ids))).all()

        for _, word in teacher_words:
            result.append(("teacher", word.id, word.char_jp, word.word_jp, word.ru, word.img))

    if len(start_data.user_subgroup_ids) > 0:
        user_words = session.scalars(
            select(UserQuizletWord).join(UserQuizletWord.subgroup).join(
                UserQuizletSubgroup.lesson).where(UserQuizletLesson.user_id == user_id).where(
                    UserQuizletWord.subgroup_id.in_(start_data.user_subgroup_ids))).all()

        for word in user_words:
            result.append(("user", word.id, word.char_jp, word.word_jp, word.ru, word.img))

    unique_result: list[tuple[str, int, str | None, str, str, str | None]] = []
    seen: set[tuple[str, str, str]] = set()
    for _, source_word_id, char_jp, word_jp, ru, img in result:
        dedupe_key = (_ensure_char(char_jp, word_jp), word_jp, ru)
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        unique_result.append(("combined", source_word_id, _ensure_char(char_jp, word_jp), word_jp, ru, img))

    return unique_result


def start_quizlet_session(user_id: int, data: QuizletStartSessionReq) -> QuizletSession:
    with DBsession.begin() as session:
        words_data = _collect_words_for_session(session, user_id, data)
        if len(words_data) < 2:
            raise InvalidAPIUsage("At least 2 words are required", 400)

        requested_limit = data.max_words if data.max_words is not None else QUIZLET_SESSION_MAX_WORDS
        effective_limit = min(requested_limit, QUIZLET_SESSION_MAX_WORDS)

        if len(words_data) > effective_limit:
            raise InvalidAPIUsage(f"Selected words exceed the allowed limit ({QUIZLET_SESSION_MAX_WORDS})", 400)

        quiz_session = QuizletSession(quiz_type=data.quiz_type,
                                      show_hints=data.show_hints,
                                      translation_direction=data.translation_direction,
                                      total_words=len(words_data),
                                      user_id=user_id,
                                      queue_state="[]")
        session.add(quiz_session)
        session.flush()

        session_words: list[QuizletSessionWord] = []
        for source_type, source_word_id, char_jp, word_jp, ru, img in words_data:
            session_word = QuizletSessionWord(source_type=source_type,
                                              source_word_id=source_word_id,
                                              char_jp=char_jp,
                                              word_jp=word_jp,
                                              ru=ru,
                                              img=img,
                                              session_id=quiz_session.id)
            session.add(session_word)
            session_words.append(session_word)

        session.flush()

        queue = [word.id for word in session_words]
        random.shuffle(queue)
        quiz_session.queue_state = _dump_queue(queue)

        return quiz_session


def get_quizlet_session(session_id: int, user_id: int) -> QuizletSession:
    with DBsession.begin() as session:
        result = session.scalars(
            select(QuizletSession).where(QuizletSession.id == session_id).where(
                QuizletSession.user_id == user_id)).one_or_none()
        if result is None:
            raise InvalidAPIUsage("Quizlet session not found", 404)
        return result


def get_active_quizlet_session(user_id: int) -> QuizletSession | None:
    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletSession).where(QuizletSession.user_id == user_id).where(
                QuizletSession.is_finished == False).order_by(QuizletSession.updated_at.desc()).order_by(
                    QuizletSession.id.desc())).first()


def get_quizlet_session_words(session_id: int) -> list[QuizletSessionWord]:
    with DBsession.begin() as session:
        return session.scalars(select(QuizletSessionWord).where(QuizletSessionWord.session_id == session_id)).all()


def _mark_incorrect_word(session, session_id: int, session_word_id: int):
    exists = session.scalars(
        select(QuizletSessionIncorrectWord).where(QuizletSessionIncorrectWord.session_id == session_id).where(
            QuizletSessionIncorrectWord.session_word_id == session_word_id)).one_or_none()
    if exists is None:
        session.add(QuizletSessionIncorrectWord(session_id=session_id, session_word_id=session_word_id))


def _insert_word_later_in_queue(queue: list[int], word_id: int):
    """
    Insert word back into the queue at a random position.
    - Minimum distance of 4 cards ahead (if possible)
    - If queue has < 4 cards, append at end
    """
    if len(queue) == 0:
        queue.append(word_id)
        return

    # If queue has fewer than 4 cards, just append at the end
    if len(queue) < 4:
        queue.append(word_id)
        return

    # Insert at a random position starting at index 4
    min_insert_pos = 4
    max_insert_pos = len(queue)
    insert_pos = random.randint(min_insert_pos, max_insert_pos)
    queue.insert(insert_pos, word_id)


def mark_quizlet_pair_attempt(user_id: int, session_id: int, left_word_id: int, right_word_id: int) -> bool:
    with DBsession.begin() as session:
        quiz_session = session.scalars(
            select(QuizletSession).where(QuizletSession.id == session_id).where(
                QuizletSession.user_id == user_id)).one_or_none()
        if quiz_session is None:
            raise InvalidAPIUsage("Quizlet session not found", 404)

        left_word = session.scalars(
            select(QuizletSessionWord).where(QuizletSessionWord.id == left_word_id).where(
                QuizletSessionWord.session_id == session_id)).one_or_none()
        right_word = session.scalars(
            select(QuizletSessionWord).where(QuizletSessionWord.id == right_word_id).where(
                QuizletSessionWord.session_id == session_id)).one_or_none()

        if left_word is None or right_word is None:
            raise InvalidAPIUsage("Session word not found", 404)

        is_correct = left_word.id == right_word.id
        queue = _load_queue(quiz_session.queue_state)

        if is_correct:
            left_word.correct_attempts = left_word.correct_attempts + 1
            if not left_word.is_correct:
                left_word.is_correct = True
                quiz_session.correct_answers = quiz_session.correct_answers + 1
            queue = [item for item in queue if item != left_word.id]
        else:
            left_word.incorrect_attempts = left_word.incorrect_attempts + 1
            quiz_session.incorrect_answers = quiz_session.incorrect_answers + 1
            _mark_incorrect_word(session, session_id, left_word.id)

        quiz_session.queue_state = _dump_queue(queue)
        quiz_session.updated_at = datetime.now()

        return is_correct


def mark_quizlet_flashcard_answer(user_id: int, session_id: int, data: QuizletFlashcardAnswerReq):
    with DBsession.begin() as session:
        quiz_session = session.scalars(
            select(QuizletSession).where(QuizletSession.id == session_id).where(
                QuizletSession.user_id == user_id)).one_or_none()
        if quiz_session is None:
            raise InvalidAPIUsage("Quizlet session not found", 404)

        word = session.scalars(
            select(QuizletSessionWord).where(QuizletSessionWord.id == data.session_word_id).where(
                QuizletSessionWord.session_id == session_id)).one_or_none()
        if word is None:
            raise InvalidAPIUsage("Session word not found", 404)

        queue = _load_queue(quiz_session.queue_state)
        queue = [item for item in queue if item != word.id]

        if data.recognized:
            word.correct_attempts = word.correct_attempts + 1
            if not word.is_correct:
                word.is_correct = True
                quiz_session.correct_answers = quiz_session.correct_answers + 1
        else:
            word.incorrect_attempts = word.incorrect_attempts + 1
            quiz_session.incorrect_answers = quiz_session.incorrect_answers + 1
            _mark_incorrect_word(session, session_id, word.id)
            # Only requeue if there are other words in the queue
            # (if queue is empty, it's the last word and will be counted as error)
            if queue:
                _insert_word_later_in_queue(queue, word.id)

        quiz_session.queue_state = _dump_queue(queue)
        quiz_session.updated_at = datetime.now()


def mark_quizlet_flashcard_viewed(user_id: int, session_id: int, session_word_id: int):
    with DBsession.begin() as session:
        quiz_session = session.scalars(
            select(QuizletSession).where(QuizletSession.id == session_id).where(
                QuizletSession.user_id == user_id)).one_or_none()
        if quiz_session is None:
            raise InvalidAPIUsage("Quizlet session not found", 404)

        word = session.scalars(
            select(QuizletSessionWord).where(QuizletSessionWord.id == session_word_id).where(
                QuizletSessionWord.session_id == session_id)).one_or_none()
        if word is None:
            raise InvalidAPIUsage("Session word not found", 404)

        word.is_skipped = True
        quiz_session.updated_at = datetime.now()


def save_quizlet_progress(user_id: int, session_id: int, data: QuizletSaveProgressReq):
    with DBsession.begin() as session:
        quiz_session = session.scalars(
            select(QuizletSession).where(QuizletSession.id == session_id).where(
                QuizletSession.user_id == user_id)).one_or_none()
        if quiz_session is None:
            raise InvalidAPIUsage("Quizlet session not found", 404)

        valid_word_ids = set(
            session.scalars(select(QuizletSessionWord.id).where(QuizletSessionWord.session_id == session_id)).all())
        queue = [word_id for word_id in data.queue if word_id in valid_word_ids]

        quiz_session.queue_state = _dump_queue(queue)
        quiz_session.updated_at = datetime.now()


def end_quizlet_session(user_id: int, session_id: int, _data: QuizletEndSessionReq) -> QuizletSession:
    with DBsession.begin() as session:
        quiz_session = session.scalars(
            select(QuizletSession).where(QuizletSession.id == session_id).where(
                QuizletSession.user_id == user_id)).one_or_none()
        if quiz_session is None:
            raise InvalidAPIUsage("Quizlet session not found", 404)

        if not quiz_session.is_finished:
            words = session.scalars(select(QuizletSessionWord).where(QuizletSessionWord.session_id == session_id)).all()
            quiz_session.skipped_words = len([
                word for word in words if (word.correct_attempts + word.incorrect_attempts) == 0 and not word.is_skipped
            ])

            quiz_session.is_finished = True
            quiz_session.ended_at = datetime.now()
            quiz_session.updated_at = datetime.now()
            quiz_session.elapsed_seconds = int((quiz_session.ended_at - quiz_session.started_at).total_seconds())

        return quiz_session


def retry_quizlet_incorrect_words(user_id: int, data: QuizletRetryIncorrectReq) -> QuizletSession:
    with DBsession.begin() as session:
        source_session = session.scalars(
            select(QuizletSession).where(QuizletSession.id == data.source_session_id).where(
                QuizletSession.user_id == user_id)).one_or_none()
        if source_session is None:
            raise InvalidAPIUsage("Source session not found", 404)

        retry_words = session.scalars(
            select(QuizletSessionWord).where(QuizletSessionWord.session_id == source_session.id)).all()
        retry_words = [
            word for word in retry_words
            if word.incorrect_attempts > 0 or (word.correct_attempts + word.incorrect_attempts) == 0
        ]

        if len(retry_words) == 0:
            raise InvalidAPIUsage("No incorrect or unviewed words to retry", 400)

        retry_session = QuizletSession(quiz_type=source_session.quiz_type,
                                       show_hints=source_session.show_hints,
                                       translation_direction=source_session.translation_direction,
                                       total_words=len(retry_words),
                                       user_id=user_id,
                                       queue_state="[]")
        session.add(retry_session)
        session.flush()

        created_words: list[QuizletSessionWord] = []
        for retry_word in retry_words:
            session_word = QuizletSessionWord(source_type=retry_word.source_type,
                                              source_word_id=retry_word.source_word_id,
                                              char_jp=retry_word.char_jp,
                                              word_jp=retry_word.word_jp,
                                              ru=retry_word.ru,
                                              img=retry_word.img,
                                              session_id=retry_session.id)
            session.add(session_word)
            created_words.append(session_word)

        session.flush()
        queue = [word.id for word in created_words]
        random.shuffle(queue)
        retry_session.queue_state = _dump_queue(queue)

        return retry_session


def get_quizlet_sessions_stats(user_id: int) -> list[QuizletSession]:
    with DBsession.begin() as session:
        return session.scalars(
            select(QuizletSession).where(QuizletSession.user_id == user_id).where(
                QuizletSession.is_finished == True).where((QuizletSession.correct_answers > 0)
                                                          | (QuizletSession.incorrect_answers > 0)).order_by(
                                                              QuizletSession.id.desc())).all()


#########################################################################################################################
################ Notifications ##########################################################################################
#########################################################################################################################
def get_notifications(user_id: int) -> list[NotificationTeacherToStudent]:
    with DBsession.begin() as session:
        select_query_student = (select(NotificationTeacherToStudent).where(
            NotificationTeacherToStudent.deleted == False).where(NotificationTeacherToStudent.student_id == user_id))

        select_query_assessment_try = (select(NotificationTeacherToStudent).where(
            NotificationTeacherToStudent.deleted == False).join(
                NotificationTeacherToStudent.assessment_try).where(AssessmentTry.user_id == user_id))

        select_query_final_boss_try = (select(NotificationTeacherToStudent).where(
            NotificationTeacherToStudent.deleted == False).join(
                NotificationTeacherToStudent.final_boss_try).where(FinalBossTry.user_id == user_id))

        return session.scalars(
            select(NotificationTeacherToStudent).from_statement(
                union_all(select_query_student, select_query_assessment_try, select_query_final_boss_try).order_by(
                    NotificationTeacherToStudent.creation_datetime.desc()))).all()


def add_final_boss_notification(final_boss_try_id: int):
    with DBsession.begin() as session:
        session.add(NotificationStudentToTeacher(final_boss_try_id=final_boss_try_id))


def add_assessment_notification(assessment_try_id: int):
    with DBsession.begin() as session:
        session.add(NotificationStudentToTeacher(assessment_try_id=assessment_try_id))


def add_drilling_notification(drilling_try_id: int):
    with DBsession.begin() as session:
        session.add(NotificationStudentToTeacher(drilling_try_id=drilling_try_id))


def add_hieroglyph_notification(hieroglyph_try_id: int):
    with DBsession.begin() as session:
        session.add(NotificationStudentToTeacher(hieroglyph_try_id=hieroglyph_try_id))


def mark_notifications_as_read(notification_ids: list[int]):
    with DBsession.begin() as session:
        # TODO: add check for user_id
        session.execute(                                                                                                #
            update(NotificationTeacherToStudent)                                                                        #
            .where(NotificationTeacherToStudent.id.in_(notification_ids))                                               #
            .values(viewed=True)                                                                                        #
        )
