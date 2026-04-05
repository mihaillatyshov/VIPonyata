import server.queries.StudentDBqueries as DBQS
from server.routes.routes_utils import get_current_user_id
from flask import request
from server.exceptions.ApiExceptions import InvalidRequestJson


def get_all_courses():
    user_id = get_current_user_id()
    return {
        "items": DBQS.get_available_courses(user_id),
        "unfinished_lessons": DBQS.get_unfinished_lessons_summary(user_id)
    }


def finish_unfinished_activity():
    if not request.json:
        raise InvalidRequestJson()

    activity_type = request.json.get("activity_type")
    activity_id = request.json.get("activity_id")
    if not isinstance(activity_type, str) or not isinstance(activity_id, int):
        raise InvalidRequestJson()

    DBQS.finish_unfinished_activity(get_current_user_id(), activity_type, activity_id)
    return {"message": "Activity closed"}
