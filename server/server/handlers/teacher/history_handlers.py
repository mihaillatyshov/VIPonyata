from typing import Any, Callable, Sequence

from flask import request

import server.queries.NotificationsDBqueries as DBQN
import server.queries.TeacherDBqueries as DBQT
from server.handlers.common.pagination import paginate_by_cursor
from server.handlers.teacher.notifications_handlers import (_collect_notification_related_ids, _get_elapsed_seconds,
                                                            _get_homework_try_metrics)
from server.models.db_models import (NotificationStudentToTeacher, QuizletSession, UserQuizletLesson,
                                     UserQuizletSubgroup)
from server.models.notifications import HistoryPageReq
from server.models.utils import validate_query_args


def _get_activity_history_label(activity_type: str) -> str:
    if activity_type == "drilling_try":
        return "Завершил тренировку слов"
    if activity_type == "hieroglyph_try":
        return "Завершил тренировку иероглифов"
    if activity_type == "assessment_try":
        return "Завершил тест"
    if activity_type == "final_boss_try":
        return "Завершил финальный тест"
    return "Завершил задание"


def _get_quizlet_session_label(is_finished: bool, has_assignment: bool) -> str:
    if is_finished:
        return "Завершил задание Quizlet" if has_assignment else "Завершил Quizlet"

    return "Начал задание Quizlet" if has_assignment else "Начал Quizlet"


def _get_quizlet_mode_label(quiz_type: str) -> str:
    if quiz_type == "pair":
        return "Парочки"
    if quiz_type == "flashcards":
        return "Флешкарточки"
    return quiz_type


def _get_students() -> list[dict[str, Any]]:
    hidden_student_ids = set(DBQT.get_hidden_quizlet_student_ids())
    return [{
        **student.__json__(),
        "is_hidden": student.id in hidden_student_ids,
    } for student in DBQT.get_all_students()]


class _HistoryItemsBuilder:
    """Превращает строки истории в элементы ответа; связанные данные грузятся пачкой на всю страницу."""
    def __init__(self, rows: Sequence[DBQN.HistoryRow], students_by_id: dict[int, dict]):
        self.students_by_id = students_by_id

        notifications = [row.data.__json__() for row in rows if row.kind == "notification"]
        activity_try_ids, homework_try_ids, _ = _collect_notification_related_ids(notifications)
        self.notifications_by_id = {item["id"]: item for item in notifications}
        self.activity_tries = DBQN.get_activity_tries_details(activity_try_ids)
        self.homework_tries = DBQN.get_homework_tries_details(homework_try_ids)

        quizlet_sessions = [row.data for row in rows if row.kind == "quizlet_session"]
        self.quizlet_assignment_titles = DBQN.get_quizlet_assignment_titles(
            {item.assignment_id
             for item in quizlet_sessions
             if item.assignment_id is not None})
        self.quizlet_topic_titles = DBQN.get_quizlet_sessions_topic_titles(quizlet_sessions)

    def build(self, row: DBQN.HistoryRow) -> dict[str, Any] | None:
        builders: dict[str, Callable[[Any], dict[str, Any] | None]] = {
            "notification": self._notification,
            "quizlet_session": self._quizlet_session,
            "personal_lesson": self._personal_lesson,
            "personal_subgroup": self._personal_subgroup,
            "personal_dictionary_edit": self._personal_dictionary_edit,
        }
        return builders[row.kind](row.data)

    def _notification(self, notification: NotificationStudentToTeacher) -> dict[str, Any] | None:
        item_data = self.notifications_by_id[notification.id]

        if item_data["type"] == "homework_try":
            homework = self.homework_tries.get(item_data["homework_try_id"])
            if homework is None:
                return None

            homework_try, assignment, _ = homework
            student = self.students_by_id.get(homework_try.student_id)
            if homework_try.end_datetime is None or student is None:
                return None

            homework_metrics = _get_homework_try_metrics(homework_try)
            return {
                "id": f"homework_try_{notification.id}",
                "event_type": "homework_completion",
                "action_type": "homework_try",
                "action_label": "Завершил домашнюю работу",
                "status": "completed",
                "created_at": homework_try.end_datetime,
                "started_at": homework_try.start_datetime,
                "completed_at": homework_try.end_datetime,
                "elapsed_seconds": homework_metrics["elapsed_seconds"],
                "mistakes_count": homework_metrics["mistakes_count"],
                "correct_answers": homework_metrics["correct_answers"],
                "skipped_words": None,
                "training_kind": "test",
                "target_name": assignment.title,
                "target_url": f"/tasks/tries/{homework_try.id}",
                "student": student,
            }

        activity_type = item_data["type"]
        activity_try_id = item_data.get("activity_try_id")
        activity = self.activity_tries.get((activity_type, activity_try_id))
        if activity is None:
            return None

        activity_try = activity["activity_try"]
        user = activity["user"]
        is_test = activity_type in ["assessment_try", "final_boss_try"]
        return {
            "id": f"activity_{notification.id}",
            "event_type": "activity_completion",
            "action_type": activity_type,
            "action_label": _get_activity_history_label(activity_type),
            "status": "completed",
            "created_at": item_data["creation_datetime"],
            "started_at": activity_try["start_datetime"],
            "completed_at": activity_try["end_datetime"],
            "elapsed_seconds": _get_elapsed_seconds(activity_try["start_datetime"], activity_try["end_datetime"]),
            "mistakes_count": activity_try["mistakes_count"],
            "correct_answers": None,
            "skipped_words": None,
            "training_kind": "test" if is_test else "practice",
            "target_name": activity["lesson"].name,
            "target_url": f"/assessment/try/{activity_try_id}" if is_test else None,
            "student": self.students_by_id.get(user.id, user.__json__()),
        }

    def _quizlet_session(self, quizlet_session: QuizletSession) -> dict[str, Any] | None:
        student = self.students_by_id.get(quizlet_session.user_id)
        if student is None:
            return None

        assignment_title = self.quizlet_assignment_titles.get(
            quizlet_session.assignment_id) if quizlet_session.assignment_id is not None else None
        return {
            "id":
            f"quizlet_session_{quizlet_session.id}",
            "event_type":
            "quizlet_session",
            "action_type":
            "quizlet_session",
            "action_label":
            _get_quizlet_session_label(quizlet_session.is_finished, quizlet_session.assignment_id is not None),
            "status":
            "completed",
            "created_at":
            quizlet_session.ended_at or quizlet_session.started_at or quizlet_session.updated_at,
            "started_at":
            quizlet_session.started_at,
            "completed_at":
            quizlet_session.ended_at,
            "elapsed_seconds":
            quizlet_session.elapsed_seconds,
            "mistakes_count":
            quizlet_session.incorrect_answers,
            "correct_answers":
            quizlet_session.correct_answers,
            "skipped_words":
            quizlet_session.skipped_words,
            "training_kind":
            "quizlet",
            "target_name":
            assignment_title
            if assignment_title is not None else f"Quizlet • {_get_quizlet_mode_label(quizlet_session.quiz_type)}",
            "target_url":
            None,
            "student":
            student,
            "quiz_type":
            quizlet_session.quiz_type,
            "translation_direction":
            quizlet_session.translation_direction,
            "total_words":
            quizlet_session.total_words,
            "topic_titles":
            self.quizlet_topic_titles.get(quizlet_session.id, []),
            "is_assignment":
            quizlet_session.assignment_id is not None,
        }

    def _dictionary_item(self, user_id: int, item: dict[str, Any]) -> dict[str, Any] | None:
        student = self.students_by_id.get(user_id)
        if student is None:
            return None

        return {
            "event_type": "personal_dictionary",
            "status": "completed",
            "started_at": item["created_at"],
            "completed_at": item["created_at"],
            "elapsed_seconds": None,
            "mistakes_count": None,
            "correct_answers": None,
            "skipped_words": None,
            "training_kind": "dictionary",
            "student": student,
            **item,
        }

    def _personal_lesson(self, lesson: UserQuizletLesson) -> dict[str, Any] | None:
        return self._dictionary_item(
            lesson.user_id, {
                "id": f"personal_lesson_{lesson.id}",
                "action_type": "personal_dictionary_created",
                "action_label": "Создал личный словарь",
                "created_at": lesson.created_at,
                "target_name": lesson.title,
                "target_url": f"/quizlet/students-dictionaries/{lesson.user_id}",
            })

    def _personal_subgroup(self, data: tuple[UserQuizletSubgroup, UserQuizletLesson]) -> dict[str, Any] | None:
        subgroup, lesson = data
        return self._dictionary_item(
            lesson.user_id, {
                "id": f"personal_subgroup_{subgroup.id}",
                "action_type": "personal_dictionary_topic_created",
                "action_label": "Создал раздел словаря",
                "created_at": subgroup.created_at,
                "target_name": f"{lesson.title} • {subgroup.title}",
                "target_url": f"/quizlet/students-dictionaries/{lesson.user_id}/topics/{subgroup.id}",
            })

    def _personal_dictionary_edit(self, edit: DBQN.PersonalDictionaryEdit) -> dict[str, Any] | None:
        return self._dictionary_item(
            edit.user_id, {
                "id": f"personal_dictionary_edit_{edit.subgroup_id}_{edit.created_at.isoformat()}",
                "action_type": "personal_dictionary_updated",
                "action_label": "Отредактировал словарь",
                "created_at": edit.created_at,
                "target_name": f"{edit.lesson_title} • {edit.subgroup_title}",
                "target_url": f"/quizlet/students-dictionaries/{edit.user_id}/topics/{edit.subgroup_id}",
            })


def _build_history_items(rows: Sequence[DBQN.HistoryRow], students_by_id: dict[int, dict]) -> list[dict[str, Any]]:
    builder = _HistoryItemsBuilder(rows, students_by_id)
    result: list[dict[str, Any]] = []
    for row in rows:
        item = builder.build(row)
        if item is not None:
            result.append(item)
    return result


def get_history():
    req = validate_query_args(HistoryPageReq, request.args.to_dict())
    students = _get_students()
    students_by_id = {student["id"]: student for student in students}

    if req.limit is None:
        # Старый формат без пагинации: вся история + ученики (для вкладок, открытых до обновления клиента).
        rows = DBQN.get_history_rows(None, None, req.student_id)
        return {"students": students, "history": _build_history_items(rows, students_by_id)}

    history, next_cursor = paginate_by_cursor(
        lambda cursor, limit: DBQN.get_history_rows(cursor, limit, req.student_id),
        lambda row: row.cursor,
        lambda rows: _build_history_items(rows, students_by_id),
        req.limit,
        req.cursor,
    )
    return {"history": history, "next_cursor": next_cursor}


def get_history_students():
    actions_count = DBQN.get_history_actions_count_by_student()
    return {
        "students": [{
            **student,
            "actions_count": actions_count.get(student["id"], 0),
        } for student in _get_students()]
    }
