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
    inside_students = DBQT.get_students_inside_course(course_id)
    inside_students_ids = [user.id for user in inside_students]
    all_students = DBQT.get_all_students()
    outside_students = [user for user in all_students if user.id not in inside_students_ids]

    return {"inside": inside_students, "outside": outside_students}
