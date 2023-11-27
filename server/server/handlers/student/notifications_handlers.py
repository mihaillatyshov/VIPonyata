from typing import Callable, TypedDict
import server.queries.StudentDBqueries as DBQS
from server.routes.routes_utils import get_current_user_id


class FuncList(TypedDict):
    assessment_try: Callable
    final_boss_try: Callable


def _get_notifications_data(activity_try_type: str, func: FuncList, *args):
    if activity_try_type == "assessment_try":
        return func["assessment_try"](*args)
    if activity_try_type == "final_boss_try":
        return func["final_boss_try"](*args)


def _get_notifications_try(activity_try_id: int, activity_try_type: str, user_id: int):
    return _get_notifications_data(activity_try_type, {
        "assessment_try": DBQS.AssessmentQueries.get_done_try_by_id,
        "final_boss_try": DBQS.FinalBossQueries.get_done_try_by_id,
    }, activity_try_id, user_id)


def _get_notifications_activity(activity_id: int, activity_try_type: str, user_id: int):
    return _get_notifications_data(activity_try_type, {
        "assessment_try": DBQS.AssessmentQueries.get_by_id_new,
        "final_boss_try": DBQS.FinalBossQueries.get_by_id_new,
    }, activity_id, user_id)


def _get_lesson_or_course_data(notification_type: str, id: int) -> dict | None:
    data = None
    if notification_type == "lesson":
        data = DBQS.get_lesson_by_id_new(id, get_current_user_id())
    if notification_type == "course":
        data = DBQS.get_course_by_id_new(id, get_current_user_id())

    if data is not None:
        data = data.__json__()
    return data


def is_lesson_or_course_notification(notification_data: dict) -> bool:
    return (
        notification_data["type"] is not None and
        (notification_data["type"] == "lesson" or notification_data["type"] == "course")
    )


def is_activity_try_notification(notification_data: dict) -> bool:
    return (
        notification_data["type"] is not None and
        (notification_data["type"] == "assessment_try" or notification_data["type"] == "final_boss_try")
    )


def get_notifications():
    result = []
    notifications = DBQS.get_notifications(get_current_user_id())

    for notification in notifications:
        item_data = notification.__json__()
        if (is_lesson_or_course_notification(item_data)):
            lesson_or_course_data = _get_lesson_or_course_data(item_data["type"], item_data[f"{item_data['type']}_id"])
            if lesson_or_course_data is None:
                continue
            item_data[item_data["type"]] = lesson_or_course_data

        if (is_activity_try_notification(item_data)):
            activity_try_data = _get_notifications_try(
                item_data["activity_try_id"],
                item_data["type"],
                get_current_user_id())
            if activity_try_data is None:
                continue
            activity_try_data = activity_try_data.__json__()

            activity_data = _get_notifications_activity(
                activity_try_data["base_id"],
                item_data["type"],
                get_current_user_id())
            if activity_data is None:
                continue
            activity_data = activity_data.__json__()

            lesson_data = DBQS.get_lesson_by_id_new(activity_data["lesson_id"], get_current_user_id())
            if lesson_data is None:
                continue
            lesson_data = lesson_data.__json__()

            item_data["activity_try"] = activity_try_data
            item_data["activity"] = activity_data
            item_data["lesson"] = lesson_data

        result.append(item_data)

    return {"notifications": result}
