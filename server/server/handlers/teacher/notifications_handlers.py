from typing import Callable, TypedDict

from flask import request

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


def get_notifications():
    result = []
    notifications = DBQT.get_notifications()
    for notification in notifications:
        item_data = notification.__json__()
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


def mark_notifications_as_read():
    if not request.json:
        raise InvalidRequestJson()

    data = NotificationsMarkAsReadReq(notification_ids=request.json.get("notification_ids"))

    DBQT.mark_notifications_as_read(data.notification_ids)

    return {"message": "ok"}
