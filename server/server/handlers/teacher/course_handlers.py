from flask import request

import server.queries.OtherDBqueries as DBQO
import server.queries.StudentDBqueries as DBQS
import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import (CourseNotFoundException, InvalidRequestJson, UserNotFoundException)
from server.models.course import CourseCreateReq
from server.models.user import ShareUserReq
from server.models.utils import validate_req
from server.routes.routes_utils import get_current_user_id


def get_all_courses():
    user_id = get_current_user_id()
    return {"items": DBQT.get_all_courses(), "unfinished_lessons": DBQS.get_unfinished_lessons_summary(user_id)}


def create_course():
    if not request.json:
        raise InvalidRequestJson()

    course_data = CourseCreateReq(**request.json)

    return {"course": DBQT.create_course(course_data)}


def update_course(course_id):
    if not request.json:
        raise InvalidRequestJson()

    if not DBQT.get_course_by_id(course_id):
        raise CourseNotFoundException(course_id)

    course_data = CourseCreateReq(**request.json)

    DBQT.update_course(course_id, course_data)

    return {"course": DBQT.get_course_by_id(course_id)}


def delete_course_by_id(course_id):
    if not DBQT.get_course_by_id(course_id):
        raise CourseNotFoundException(course_id)

    DBQT.delete_course_by_id(course_id)

    return {"message": "Course deleted"}


def get_course_users(course_id):
    inside_students = DBQT.get_students_inside_course(course_id)
    inside_students_ids = [user.id for user in inside_students]
    all_students = DBQT.get_all_students()
    outside_students = [user for user in all_students if user.id not in inside_students_ids]

    return {"inside": inside_students, "outside": outside_students}


def add_or_remove_user_from_course(course_id):
    user_req_data = validate_req(ShareUserReq, request.json)

    if DBQT.get_course_by_id(course_id) is None:
        raise CourseNotFoundException(course_id)

    if DBQO.get_user_by_id(user_req_data.user_id) is None:
        raise UserNotFoundException(user_req_data.user_id)

    if DBQT.is_student_inside_course(course_id, user_req_data.user_id):
        DBQT.remove_user_from_course(course_id, user_req_data.user_id)
    else:
        DBQT.add_user_to_course(course_id, user_req_data.user_id)
        DBQT.add_course_notification(course_id, user_req_data.user_id)

    return {"message": "User added to course"}


def finish_unfinished_activity():
    if not request.json:
        raise InvalidRequestJson()

    activity_type = request.json.get("activity_type")
    activity_id = request.json.get("activity_id")
    if not isinstance(activity_type, str) or not isinstance(activity_id, int):
        raise InvalidRequestJson()

    DBQS.finish_unfinished_activity(get_current_user_id(), activity_type, activity_id)
    return {"message": "Activity closed"}
