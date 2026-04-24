import re
from typing import Callable, TypedDict

from flask import request

import server.queries.StudentDBqueries as DBQS
from server.exceptions.ApiExceptions import InvalidRequestJson
from server.models.notifications import NotificationsMarkAsReadReq
from server.routes.routes_utils import get_current_user_id


class FuncList(TypedDict):
    assessment_try: Callable
    final_boss_try: Callable


def _get_notifications_data(activity_try_type: str, func: FuncList, *args):
    if activity_try_type == "assessment_try":
        return func["assessment_try"](*args)
    if activity_try_type == "final_boss_try":
        return func["final_boss_try"](*args)


def _get_notifications_try(activity_try_id: int, activity_try_type: str,
                           user_id: int) -> DBQS.ActivityTryForNotificationType | None:
    return _get_notifications_data(
        activity_try_type, {
            "assessment_try": DBQS.AssessmentQueries.get_done_try_for_notifications_by_id,
            "final_boss_try": DBQS.FinalBossQueries.get_done_try_for_notifications_by_id,
        }, activity_try_id, user_id)


def _get_notifications_activity(activity_id: int, activity_try_type: str,
                                user_id: int) -> DBQS.ActivityForNotificationType | None:
    return _get_notifications_data(
        activity_try_type, {
            "assessment_try": DBQS.AssessmentQueries.get_for_notifications_by_id,
            "final_boss_try": DBQS.FinalBossQueries.get_for_notifications_by_id,
        }, activity_id, user_id)


def _get_lesson_or_course_data(notification_type: str, course_or_lesson_id: int) -> dict | None:
    data = None
    if notification_type == "lesson":
        data = DBQS.get_lesson_by_id_new(course_or_lesson_id, get_current_user_id())
    if notification_type == "course":
        data = DBQS.get_course_by_id_new(course_or_lesson_id, get_current_user_id())

    if data is not None:
        data = data.__json__()
    return data


def is_lesson_or_course_notification(notification_data: dict) -> bool:
    return (notification_data["type"] is not None
            and (notification_data["type"] == "lesson" or notification_data["type"] == "course"))


def is_activity_try_notification(notification_data: dict) -> bool:
    return (notification_data["type"] is not None
            and (notification_data["type"] == "assessment_try" or notification_data["type"] == "final_boss_try"))


QUIZLET_DICTIONARY_LINK_PATTERN = re.compile(r"\[\[quizlet_dict_link:(.+?)\|(.+?)\]\]")
QUIZLET_TOPIC_CREATED_PATTERN = re.compile(r"\[\[quizlet_topic_created:(.+?)\|(.+?)\]\]")
QUIZLET_TOPIC_UPDATED_PATTERN = re.compile(r"\[\[quizlet_topic_updated:(.+?)\|(.+?)\]\]")


def _parse_quizlet_dictionary_notification(item_data: dict) -> dict:
    message = item_data.get("message")
    if item_data.get("type") is not None or not isinstance(message, str):
        return item_data

    topic_created_marker = QUIZLET_TOPIC_CREATED_PATTERN.search(message)
    if topic_created_marker is not None:
        link = topic_created_marker.group(1).strip()
        title = topic_created_marker.group(2).strip()
        cleaned_message = QUIZLET_TOPIC_CREATED_PATTERN.sub(title, message).strip()

        if len(link) == 0:
            return item_data

        item_data["type"] = "quizlet_personal_dictionary_topic_created"
        item_data["message"] = cleaned_message
        item_data["quizlet_dictionary_link"] = link
        item_data["quizlet_dictionary_title"] = title

        return item_data

    topic_updated_marker = QUIZLET_TOPIC_UPDATED_PATTERN.search(message)
    if topic_updated_marker is not None:
        link = topic_updated_marker.group(1).strip()
        title = topic_updated_marker.group(2).strip()
        cleaned_message = QUIZLET_TOPIC_UPDATED_PATTERN.sub(title, message).strip()

        if len(link) == 0:
            return item_data

        item_data["type"] = "quizlet_personal_dictionary_topic_updated"
        item_data["message"] = cleaned_message
        item_data["quizlet_dictionary_link"] = link
        item_data["quizlet_dictionary_title"] = title

        return item_data

    marker = QUIZLET_DICTIONARY_LINK_PATTERN.search(message)
    if marker is None:
        return item_data

    link = marker.group(1).strip()
    title = marker.group(2).strip()
    cleaned_message = QUIZLET_DICTIONARY_LINK_PATTERN.sub(title, message).strip()

    if len(link) == 0:
        return item_data

    item_data["type"] = "quizlet_personal_dictionary_update"
    item_data["message"] = cleaned_message
    item_data["quizlet_dictionary_link"] = link
    item_data["quizlet_dictionary_title"] = title

    return item_data


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
            activity_try_data = _get_notifications_try(item_data["activity_try_id"], item_data["type"],
                                                       get_current_user_id())
            if activity_try_data is None:
                continue

            activity_data = _get_notifications_activity(activity_try_data["base_id"], item_data["type"],
                                                        get_current_user_id())
            if activity_data is None:
                continue

            lesson_data = DBQS.get_lesson_by_id_new(activity_data["lesson_id"], get_current_user_id())
            if lesson_data is None:
                continue
            lesson_data = lesson_data.__json__()

            item_data["activity_try"] = activity_try_data
            item_data["lesson"] = lesson_data

        if item_data.get("type") == "quizlet_assignment":
            assignment_id = item_data.get("assignment_id")
            if not isinstance(assignment_id, int):
                continue

            assignment = DBQS.get_quizlet_assignment_by_id_for_student(assignment_id, get_current_user_id())
            if assignment is None:
                continue

            item_data["quizlet_assignment"] = {"id": assignment.id, "title": assignment.title}

        item_data = _parse_quizlet_dictionary_notification(item_data)
        result.append(item_data)

    return {"notifications": result}


def mark_notifications_as_read():
    if not request.json:
        raise InvalidRequestJson()

    data = NotificationsMarkAsReadReq(notification_ids=request.json.get("notification_ids"))

    DBQS.mark_notifications_as_read(data.notification_ids)

    return {"message": "ok"}
