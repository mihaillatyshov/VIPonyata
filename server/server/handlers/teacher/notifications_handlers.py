import json
from typing import Any, Sequence

from flask import request

import server.queries.NotificationsDBqueries as DBQN
import server.queries.TeacherDBqueries as DBQT
from server.handlers.common.pagination import notification_cursor, paginate_by_cursor
from server.models.db_models import NotificationStudentToTeacher
from server.models.notifications import NotificationsMarkAsReadReq, NotificationsPageReq
from server.models.utils import validate_query_args, validate_req


def _get_elapsed_seconds(start_datetime, end_datetime) -> int | None:
    if start_datetime is None or end_datetime is None:
        return None

    return max(0, int((end_datetime - start_datetime).total_seconds()))


def _get_homework_try_metrics(homework_try) -> dict[str, int | None]:
    checked_tasks = json.loads(homework_try.checked_tasks)
    mistakes_count = sum(task.get("mistakes_count", 0) for task in checked_tasks)
    correct_answers = 0

    for done_task, checked_task in zip(json.loads(homework_try.done_tasks), checked_tasks):
        if done_task.get("name") in ["text", "img", "audio", "block_begin", "block_end"]:
            continue
        if checked_task.get("cheked", False) and checked_task.get("mistakes_count", 0) == 0:
            correct_answers += 1

    return {
        "mistakes_count": mistakes_count,
        "correct_answers": correct_answers,
        "elapsed_seconds": _get_elapsed_seconds(homework_try.start_datetime, homework_try.end_datetime),
    }


def _collect_notification_related_ids(items: list[dict[str, Any]]) -> tuple[dict[str, set[int]], set[int], set[int]]:
    """id попыток по типам активностей, id попыток домашних работ и id результатов Quizlet из уведомлений."""
    activity_try_ids: dict[str, set[int]] = {}
    homework_try_ids: set[int] = set()
    quizlet_result_ids: set[int] = set()

    for item in items:
        if item["type"] == "quizlet_assignment_result":
            quizlet_result_ids.add(item["assignment_result_id"])
        elif item["type"] == "homework_try":
            if isinstance(item.get("homework_try_id"), int):
                homework_try_ids.add(item["homework_try_id"])
        elif item["type"] is not None:
            activity_try_ids.setdefault(item["type"], set()).add(item["activity_try_id"])

    return activity_try_ids, homework_try_ids, quizlet_result_ids


def _build_notifications(notifications: Sequence[NotificationStudentToTeacher]) -> list[dict[str, Any]]:
    items = [notification.__json__() for notification in notifications]

    activity_try_ids, homework_try_ids, quizlet_result_ids = _collect_notification_related_ids(items)
    activity_tries = DBQN.get_activity_tries_details(activity_try_ids)
    homework_tries = DBQN.get_homework_tries_details(homework_try_ids)
    quizlet_results = DBQN.get_quizlet_assignment_results_details(quizlet_result_ids)

    result: list[dict[str, Any]] = []
    for item_data in items:
        if item_data["type"] == "quizlet_assignment_result":
            quizlet_result = quizlet_results.get(item_data["assignment_result_id"])
            if quizlet_result is None:
                continue

            assignment_result, quizlet_assignment, student = quizlet_result
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
                "id": quizlet_assignment.id,
                "name": quizlet_assignment.title,
            }
            item_data["user"] = student.__json__()
            result.append(item_data)
            continue

        if item_data["type"] == "homework_try":
            homework_try_id = item_data.get("homework_try_id")
            homework = homework_tries.get(homework_try_id) if isinstance(homework_try_id, int) else None
            if homework is None:
                continue

            homework_try, assignment, student = homework
            if homework_try.end_datetime is None:
                continue

            homework_metrics = _get_homework_try_metrics(homework_try)

            item_data["activity_try"] = {
                "id": homework_try.id,
                "start_datetime": homework_try.start_datetime,
                "end_datetime": homework_try.end_datetime,
                "mistakes_count": homework_metrics["mistakes_count"],
                "correct_answers": homework_metrics["correct_answers"],
                "elapsed_seconds": homework_metrics["elapsed_seconds"],
            }
            item_data["activity_try_id"] = homework_try.id
            item_data["lesson"] = {
                "id": assignment.id,
                "name": assignment.title,
            }
            item_data["user"] = student.__json__()
            result.append(item_data)
            continue

        if item_data["type"] is not None:
            activity_try = activity_tries.get((item_data["type"], item_data["activity_try_id"]))
            if activity_try is None:
                continue

            item_data["activity_try"] = activity_try["activity_try"]
            item_data["lesson"] = activity_try["lesson"].__json__()
            item_data["user"] = activity_try["user"].__json__()

        result.append(item_data)

    return result


def get_notifications():
    req = validate_query_args(NotificationsPageReq, request.args.to_dict())

    if req.limit is None:
        return {"notifications": _build_notifications(DBQN.get_teacher_notifications_page(None, None))}

    notifications, next_cursor = paginate_by_cursor(DBQN.get_teacher_notifications_page, notification_cursor,
                                                    _build_notifications, req.limit, req.cursor)
    return {"notifications": notifications, "next_cursor": next_cursor}


def get_unread_notifications_count():
    return {"count": DBQN.get_teacher_unread_notifications_count()}


def mark_notifications_as_read():
    data = validate_req(NotificationsMarkAsReadReq, request.json)

    DBQT.mark_notifications_as_read(data.notification_ids)

    return {"message": "ok"}


def mark_all_notifications_as_read():
    DBQN.mark_all_teacher_notifications_as_read()

    return {"message": "ok"}
