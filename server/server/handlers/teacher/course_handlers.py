from flask import request

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidRequestJson
from server.models.course import CourseCreateReq


def get_all_courses():
    return {"items": DBQT.get_all_courses()}


def create_course():
    if not request.json:
        raise InvalidRequestJson()

    course_data = CourseCreateReq(**request.json)

    return {"course": DBQT.create_course(course_data)}


def get_course_users(course_id):
    iside_users = DBQT.get_users_inside_course(course_id)
    all_users = DBQT.get_all_users()
    outside_users = [user for user in all_users if user not in iside_users]

    return {"inside": iside_users, "outside": outside_users}
