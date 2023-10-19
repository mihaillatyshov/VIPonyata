from typing import Callable, TypedDict
import server.queries.TeacherDBqueries as DBQT


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


def _get_notifications_try(activity_try_id: int, activity_try_type: str):
    return _get_notifications_data(activity_try_type, {
        "drilling_try": DBQT.DrillingQueries.get_try_by_id,
        "hieroglyph_try": DBQT.HieroglyphQueries.get_try_by_id,
        "assessment_try": DBQT.AssessmentQueries.get_try_by_id,
        "final_boss_try": DBQT.FinalBossQueries.get_try_by_id,
    }, activity_try_id)


def _get_notifications_activity(activity_id: int, activity_try_type: str):
    return _get_notifications_data(activity_try_type, {
        "drilling_try": DBQT.DrillingQueries.GetById,
        "hieroglyph_try": DBQT.HieroglyphQueries.GetById,
        "assessment_try": DBQT.AssessmentQueries.GetById,
        "final_boss_try": DBQT.FinalBossQueries.GetById,
    }, activity_id)


def _get_notifications_user(activity_try_id: int, activity_try_type: str):
    return _get_notifications_data(activity_try_type, {
        "drilling_try":     DBQT.DrillingQueries.get_user_by_try_id,
        "hieroglyph_try":   DBQT.HieroglyphQueries.get_user_by_try_id,
        "assessment_try":   DBQT.AssessmentQueries.get_user_by_try_id,
        "final_boss_try":   DBQT.FinalBossQueries.get_user_by_try_id,
    }, activity_try_id)


def get_notifications():
    result = []
    notifications = DBQT.get_notifications()
    for notification in notifications:
        item_data = notification.__json__()
        if item_data["type"] is not None:
            activity_try_data = _get_notifications_try(item_data["activity_try_id"], item_data["type"]).__json__()
            activity_data = _get_notifications_activity(activity_try_data["base_id"], item_data["type"]).__json__()
            lesson_data = DBQT.get_lesson_by_id(activity_data["lesson_id"]).__json__()
            user_data = _get_notifications_user(item_data["activity_try_id"], item_data["type"]).__json__()

            item_data["activity_try"] = activity_try_data
            item_data["activity"] = activity_data
            item_data["lesson"] = lesson_data
            item_data["user"] = user_data

        result.append(item_data)

    return {"notifications": result}
