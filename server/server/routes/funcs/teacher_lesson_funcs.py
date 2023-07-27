from flask import request

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidRequestJson
from server.models.lesson import LessonCreateReq


def getLessonsByCourseId(courseId: int):
    if course := DBQT.GetCourseById(courseId):
        return {"course": course, "items": DBQT.GetLessonsByCourseId(courseId)}

    return {"course": None, "items": None}, 403


def getLessonActivities(lessonId: int):
    if lesson := DBQT.GetLessonById(lessonId):
        # drilling = lesson.drilling
        #assesment = GetAssessmentByLessonId(id)
        #hieroglyph = GetHieroglyphByLessonId(id)

        dril = None
        asse = None
        hier = None

        return {"lesson": lesson, "items": {"drilling": dril, "assessment": asse, "hieroglyph": hier}}

    return {"lesson": None, "items": None}, 404


def create_lesson(course_id: int):
    if not request.json:
        raise InvalidRequestJson()

    lesson_data = LessonCreateReq(**request.json)

    return {"lesson": DBQT.create_lesson(course_id, lesson_data)}