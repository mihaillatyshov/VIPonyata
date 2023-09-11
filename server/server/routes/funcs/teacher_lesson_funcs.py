from flask import request

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.models.lesson import LessonCreateReq


def getLessonsByCourseId(courseId: int):
    if course := DBQT.GetCourseById(courseId):
        return {"course": course, "items": DBQT.GetLessonsByCourseId(courseId)}

    return {"course": None, "items": None}, 403


def getLessonActivities(lessonId: int):
    if lesson := DBQT.GetLessonById(lessonId):
        drilling = lesson.drilling
        assessment = lesson.assessment
        hieroglyph = lesson.hieroglyph

        return {"lesson": lesson, "items": {"drilling": drilling, "assessment": assessment, "hieroglyph": hieroglyph}}

    return {"lesson": None, "items": None}, 404


def create_lesson(course_id: int):
    if not request.json:
        raise InvalidRequestJson()

    if not DBQT.GetCourseById(course_id):
        raise InvalidAPIUsage("No course in db!", 403)

    lesson_data = LessonCreateReq(**request.json)

    return {"lesson": DBQT.create_lesson(course_id, lesson_data)}