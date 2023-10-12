from flask import request

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.models.lesson import LessonCreateReq


def get_lessons_by_course_id(course_id: int):
    if course := DBQT.get_course_by_id(course_id):
        return {"course": course, "items": DBQT.get_lessons_by_course_id(course_id)}

    return {"course": None, "items": None}, 403


def get_lesson_activities(lesson_id: int):
    if lesson := DBQT.get_lesson_by_id(lesson_id):

        return {"lesson": lesson,
                "items": {"drilling": lesson.drilling,
                          "assessment": lesson.assessment,
                          "hieroglyph": lesson.hieroglyph}}

    return {"lesson": None, "items": None}, 404


def create_lesson(course_id: int):
    if not request.json:
        raise InvalidRequestJson()

    if not DBQT.get_course_by_id(course_id):
        raise InvalidAPIUsage("No course in db!", 403)

    lesson_data = LessonCreateReq(**request.json)

    return {"lesson": DBQT.create_lesson(course_id, lesson_data)}
