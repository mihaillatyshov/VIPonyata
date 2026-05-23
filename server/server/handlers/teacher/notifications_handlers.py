from datetime import datetime
from typing import Any, Callable, List, TypedDict

from flask import request

import server.queries.OtherDBqueries as DBQO
import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidRequestJson
from server.models.notifications import NotificationsMarkAsReadReq


class FuncList(TypedDict):
    drilling_try: Callable
    hieroglyph_try: Callable
    assessment_try: Callable
    final_boss_try: Callable


def _get_notifications_data(activity_try_type: str, func: FuncList, *args):
    if activity_try_type == "drilling_try":
        return func["drilling_try"](*args)
    if activity_try_type == "hieroglyph_try":
        return func["hieroglyph_try"](*args)
    if activity_try_type == "assessment_try":
        return func["assessment_try"](*args)
    if activity_try_type == "final_boss_try":
        return func["final_boss_try"](*args)


def _get_notifications_try(activity_try_id: int, activity_try_type: str) -> DBQT.ActivityTryForNotificationType | None:
    return _get_notifications_data(
        activity_try_type, {
            "drilling_try": DBQT.DrillingQueries.get_try_for_notifications_by_id,
            "hieroglyph_try": DBQT.HieroglyphQueries.get_try_for_notifications_by_id,
            "assessment_try": DBQT.AssessmentQueries.get_try_for_notifications_by_id,
            "final_boss_try": DBQT.FinalBossQueries.get_try_for_notifications_by_id,
        }, activity_try_id)


def _get_notifications_activity(activity_id: int, activity_try_type: str) -> DBQT.ActivityForNotificationType | None:
    return _get_notifications_data(
        activity_try_type, {
            "drilling_try": DBQT.DrillingQueries.get_for_notifications_by_id,
            "hieroglyph_try": DBQT.HieroglyphQueries.get_for_notifications_by_id,
            "assessment_try": DBQT.AssessmentQueries.get_for_notifications_by_id,
            "final_boss_try": DBQT.FinalBossQueries.get_for_notifications_by_id,
        }, activity_id)


def _get_notifications_user(activity_try_id: int, activity_try_type: str):
    return _get_notifications_data(
        activity_try_type, {
            "drilling_try": DBQT.DrillingQueries.get_user_by_try_id,
            "hieroglyph_try": DBQT.HieroglyphQueries.get_user_by_try_id,
            "assessment_try": DBQT.AssessmentQueries.get_user_by_try_id,
            "final_boss_try": DBQT.FinalBossQueries.get_user_by_try_id,
        }, activity_try_id)


def _get_elapsed_seconds(start_datetime, end_datetime) -> int | None:
    if start_datetime is None or end_datetime is None:
        return None

    return max(0, int((end_datetime - start_datetime).total_seconds()))


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


def _get_quizlet_topic_titles(quizlet_session: DBQT.QuizletSession) -> list[str]:
    topic_titles = [
        subgroup.title for subgroup in DBQT.get_quizlet_subgroups_by_ids(quizlet_session.get_subgroup_ids())
    ]
    topic_titles.extend(
        subgroup.title
        for subgroup in DBQT.get_personal_quizlet_subgroups_by_ids(quizlet_session.get_user_subgroup_ids()))
    if len(topic_titles) > 0:
        return list(dict.fromkeys(topic_titles))

    if quizlet_session.assignment_id is not None:
        assignment_subgroup_ids = DBQT.get_quizlet_assignment_subgroup_ids(quizlet_session.assignment_id)
        assignment_subgroups = DBQT.get_quizlet_subgroups_by_ids(assignment_subgroup_ids)
        topic_titles = [subgroup.title for subgroup in assignment_subgroups]

        assignment_target = DBQT.get_quizlet_assignment_target(quizlet_session.assignment_id, quizlet_session.user_id)
        if assignment_target is not None:
            topic_titles.extend(
                subgroup.title
                for subgroup in DBQT.get_quizlet_assignment_target_personal_subgroups(assignment_target.id))

        return list(dict.fromkeys(topic_titles))

    return []


def _append_history_item(result: List[dict[str, Any]], item: dict[str, Any]):
    item["sort_datetime"] = item.get("created_at") or datetime.min
    result.append(item)


def _build_activity_history(students_by_id: dict[int, dict]) -> List[dict[str, Any]]:
    result: List[dict[str, Any]] = []

    for notification in DBQT.get_notifications():
        item_data = notification.__json__()
        if item_data["type"] is None or item_data["type"] == "quizlet_assignment_result":
            continue

        activity_try_data = _get_notifications_try(item_data["activity_try_id"], item_data["type"])
        if activity_try_data is None:
            continue

        activity_data = _get_notifications_activity(activity_try_data["base_id"], item_data["type"])
        if activity_data is None:
            continue

        lesson_data = DBQT.get_lesson_by_id(activity_data["lesson_id"])
        if lesson_data is None:
            continue

        user_data = _get_notifications_user(item_data["activity_try_id"], item_data["type"])
        if user_data is None:
            continue

        started_at = activity_try_data["start_datetime"]
        completed_at = activity_try_data["end_datetime"]
        _append_history_item(
            result, {
                "id":
                f"activity_{notification.id}",
                "event_type":
                "activity_completion",
                "action_type":
                item_data["type"],
                "action_label":
                _get_activity_history_label(item_data["type"]),
                "status":
                "completed",
                "created_at":
                item_data["creation_datetime"],
                "started_at":
                started_at,
                "completed_at":
                completed_at,
                "elapsed_seconds":
                _get_elapsed_seconds(started_at, completed_at),
                "mistakes_count":
                activity_try_data["mistakes_count"],
                "correct_answers":
                None,
                "skipped_words":
                None,
                "training_kind":
                "test" if item_data["type"] in ["assessment_try", "final_boss_try"] else "practice",
                "target_name":
                lesson_data.name,
                "target_url":
                f"/{'assessment' if item_data['type'] in ['assessment_try', 'final_boss_try'] else item_data['type'].replace('_try', '')}/try/{item_data['activity_try_id']}"
                if item_data["type"] in ["assessment_try", "final_boss_try"] else None,
                "student":
                students_by_id.get(user_data.id, user_data.__json__()),
            })

    return result


def _build_quizlet_sessions_history(students_by_id: dict[int, dict]) -> List[dict[str, Any]]:
    result: List[dict[str, Any]] = []

    for quizlet_session in DBQT.get_history_quizlet_sessions():
        if not quizlet_session.is_finished:
            continue

        student = students_by_id.get(quizlet_session.user_id)
        if student is None:
            continue

        assignment = None
        if quizlet_session.assignment_id is not None:
            assignment = DBQT.get_quizlet_assignment_by_id(quizlet_session.assignment_id)

        _append_history_item(
            result, {
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
                assignment.title if assignment is not None else
                (f"Quizlet • {_get_quizlet_mode_label(quizlet_session.quiz_type)}"),
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
                _get_quizlet_topic_titles(quizlet_session),
                "is_assignment":
                quizlet_session.assignment_id is not None,
            })

    return result


def _build_personal_dictionary_history(students_by_id: dict[int, dict]) -> List[dict[str, Any]]:
    result: List[dict[str, Any]] = []

    lessons = DBQT.get_history_personal_quizlet_lessons()
    lesson_by_id = {lesson.id: lesson for lesson in lessons}
    for lesson in lessons:
        student = students_by_id.get(lesson.user_id)
        if student is None:
            continue

        _append_history_item(
            result, {
                "id": f"personal_lesson_{lesson.id}",
                "event_type": "personal_dictionary",
                "action_type": "personal_dictionary_created",
                "action_label": "Создал личный словарь",
                "status": "completed",
                "created_at": lesson.created_at,
                "started_at": lesson.created_at,
                "completed_at": lesson.created_at,
                "elapsed_seconds": None,
                "mistakes_count": None,
                "correct_answers": None,
                "skipped_words": None,
                "training_kind": "dictionary",
                "target_name": lesson.title,
                "target_url": f"/quizlet/students-dictionaries/{lesson.user_id}",
                "student": student,
            })

    subgroups = DBQT.get_history_personal_quizlet_subgroups()
    subgroup_by_id = {subgroup.id: subgroup for subgroup in subgroups}
    for subgroup in subgroups:
        if subgroup.lesson_id not in lesson_by_id:
            continue
        subgroup_lesson = lesson_by_id[subgroup.lesson_id]

        student = students_by_id.get(subgroup_lesson.user_id)
        if student is None:
            continue

        _append_history_item(
            result, {
                "id": f"personal_subgroup_{subgroup.id}",
                "event_type": "personal_dictionary",
                "action_type": "personal_dictionary_topic_created",
                "action_label": "Создал раздел словаря",
                "status": "completed",
                "created_at": subgroup.created_at,
                "started_at": subgroup.created_at,
                "completed_at": subgroup.created_at,
                "elapsed_seconds": None,
                "mistakes_count": None,
                "correct_answers": None,
                "skipped_words": None,
                "training_kind": "dictionary",
                "target_name": f"{subgroup_lesson.title} • {subgroup.title}",
                "target_url": f"/quizlet/students-dictionaries/{subgroup_lesson.user_id}/topics/{subgroup.id}",
                "student": student,
            })

    dictionary_edits: dict[tuple[int, datetime], dict[str, Any]] = {}
    for word in DBQT.get_history_personal_quizlet_words():
        if word.subgroup_id not in subgroup_by_id:
            continue
        word_subgroup = subgroup_by_id[word.subgroup_id]

        if word_subgroup.lesson_id not in lesson_by_id:
            continue
        word_lesson = lesson_by_id[word_subgroup.lesson_id]

        student = students_by_id.get(word_lesson.user_id)
        if student is None:
            continue

        edit_key = (word_subgroup.id, word.created_at)
        if edit_key in dictionary_edits:
            continue

        dictionary_edits[edit_key] = {
            "id": f"personal_dictionary_edit_{word_subgroup.id}_{word.created_at.isoformat()}",
            "event_type": "personal_dictionary",
            "action_type": "personal_dictionary_updated",
            "action_label": "Отредактировал словарь",
            "status": "completed",
            "created_at": word.created_at,
            "started_at": word.created_at,
            "completed_at": word.created_at,
            "elapsed_seconds": None,
            "mistakes_count": None,
            "correct_answers": None,
            "skipped_words": None,
            "training_kind": "dictionary",
            "target_name": f"{word_lesson.title} • {word_subgroup.title}",
            "target_url": f"/quizlet/students-dictionaries/{word_lesson.user_id}/topics/{word_subgroup.id}",
            "student": student,
        }

    for item in dictionary_edits.values():
        _append_history_item(result, item)

    return result


def get_notifications():
    result: List[dict[str, Any]] = []
    notifications = DBQT.get_notifications()
    for notification in notifications:
        item_data = notification.__json__()
        if item_data["type"] == "quizlet_assignment_result":
            assignment_result = DBQT.get_quizlet_assignment_result_by_id(item_data["assignment_result_id"])
            if assignment_result is None:
                continue

            assignment = DBQT.get_quizlet_assignment_by_id(assignment_result.assignment_id)
            if assignment is None:
                continue

            student = DBQO.get_user_by_id(assignment_result.student_id)
            if student is None:
                continue

            item_data["activity_try"] = {
                "id": assignment_result.id,
                "start_datetime": assignment_result.completed_at,
                "end_datetime": assignment_result.completed_at,
                "mistakes_count": assignment_result.incorrect_answers,
                "correct_answers": assignment_result.correct_answers,
                "skipped_words": assignment_result.skipped_words,
                "elapsed_seconds": assignment_result.elapsed_seconds,
            }
            item_data["activity_try_id"] = assignment_result.id
            item_data["lesson"] = {
                "id": assignment.id,
                "name": assignment.title,
            }
            item_data["user"] = student.__json__()
            result.append(item_data)
            continue

        if item_data["type"] is not None:
            activity_try_data = _get_notifications_try(item_data["activity_try_id"], item_data["type"])
            if activity_try_data is None:
                continue

            activity_data = _get_notifications_activity(activity_try_data["base_id"], item_data["type"])
            if activity_data is None:
                continue

            lesson_data = DBQT.get_lesson_by_id(activity_data["lesson_id"])
            if lesson_data is None:
                continue

            user_data = _get_notifications_user(item_data["activity_try_id"], item_data["type"])
            if user_data is None:
                continue

            item_data["activity_try"] = activity_try_data
            item_data["lesson"] = lesson_data.__json__()
            item_data["user"] = user_data.__json__()

        result.append(item_data)

    return {"notifications": result}


def get_history():
    students = [student.__json__() for student in DBQT.get_all_students()]
    students_by_id = {student["id"]: student for student in students}

    history = []
    history.extend(_build_activity_history(students_by_id))
    history.extend(_build_quizlet_sessions_history(students_by_id))
    history.extend(_build_personal_dictionary_history(students_by_id))

    history.sort(key=lambda item: item["sort_datetime"], reverse=True)
    for item in history:
        item.pop("sort_datetime", None)

    return {"students": students, "history": history}


def mark_notifications_as_read():
    if not request.json:
        raise InvalidRequestJson()

    data = NotificationsMarkAsReadReq(notification_ids=request.json.get("notification_ids"))

    DBQT.mark_notifications_as_read(data.notification_ids)

    return {"message": "ok"}
