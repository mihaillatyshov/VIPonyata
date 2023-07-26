from flask import request

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidRequestJson
from server.models.course import CourseCreateReq


def getAllCourses():
    return {"items": DBQT.GetCourses()}


def create_course():
    if not request.json:
        raise InvalidRequestJson()

    course_data = CourseCreateReq(**request.json)

    return {"course": DBQT.create_course(course_data)}