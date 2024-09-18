from flask import request

import server.queries.OtherDBqueries as DBQO
import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import (CourseNotFoundException, InvalidRequestJson, LessonNotFoundException,
                                             UserNotFoundException)
from server.models.lesson import LessonCreateReq
from server.models.user import ShareUserReq
from server.models.utils import validate_req


def get_lessons_by_course_id(course_id: int):
    if course := DBQT.get_course_by_id(course_id):
        return {"course": course, "items": DBQT.get_lessons_by_course_id(course_id)}

    return {"course": None, "items": None}, 403


def get_lesson_activities(lesson_id: int):
    if lesson := DBQT.get_lesson_by_id(lesson_id):

        return {
            "lesson": lesson,
            "items": {
                "drilling": DBQT.DrillingQueries.get_by_lesson_id(lesson_id),
                "assessment": DBQT.AssessmentQueries.get_by_lesson_id(lesson_id),
                "hieroglyph": DBQT.HieroglyphQueries.get_by_lesson_id(lesson_id),
                "final_boss": DBQT.FinalBossQueries.get_by_lesson_id(lesson_id)
            }
        }

    return {"lesson": None, "items": None}, 404


def create_lesson(course_id: int):
    if not request.json:
        raise InvalidRequestJson()

    if not DBQT.get_course_by_id(course_id):
        raise CourseNotFoundException(course_id)

    lesson_data = LessonCreateReq(**request.json)

    return {"lesson": DBQT.create_lesson(course_id, lesson_data)}


def update_lesson(lesson_id: int):
    if not request.json:
        raise InvalidRequestJson()

    if DBQT.get_lesson_by_id(lesson_id) is None:
        raise LessonNotFoundException(lesson_id)

    lesson_data = LessonCreateReq(**request.json)

    DBQT.update_lesson(lesson_id, lesson_data)

    return {"lesson": DBQT.get_lesson_by_id(lesson_id)}


def delete_lesson_by_id(lesson_id: int):
    if not DBQT.get_lesson_by_id(lesson_id):
        raise LessonNotFoundException(lesson_id)

    DBQT.delete_lesson_by_id(lesson_id)

    return {"message": "Lesson deleted successfully"}


def get_lesson_users(lesson_id: int):
    lesson = DBQT.get_lesson_by_id(lesson_id)
    if lesson is None:
        raise LessonNotFoundException(lesson_id)

    inside_students = DBQT.get_students_inside_lesson(lesson_id)
    inside_students_ids = [user.id for user in inside_students]
    all_students = DBQT.get_all_students()
    inside_course_students = DBQT.get_students_inside_course(lesson.course_id)
    inside_course_students_ids = [user.id for user in inside_course_students]

    outside_students = [
        user for user in all_students if user.id not in inside_students_ids and user.id in inside_course_students_ids
    ]

    return {"inside": inside_students, "outside": outside_students}


def add_or_remove_user_from_lesson(lesson_id: int):
    user_req_data = validate_req(ShareUserReq, request.json)

    if not DBQT.get_lesson_by_id(lesson_id):
        raise LessonNotFoundException(lesson_id)

    if not DBQO.get_user_by_id(user_req_data.user_id):
        raise UserNotFoundException(user_req_data.user_id)

    if DBQT.is_student_inside_lesson(lesson_id, user_req_data.user_id):
        DBQT.remove_user_from_lesson(lesson_id, user_req_data.user_id)
    else:
        DBQT.add_user_to_lesson(lesson_id, user_req_data.user_id)
        DBQT.add_lesson_notification(lesson_id, user_req_data.user_id)

    return {"message": "User added to lesson"}
