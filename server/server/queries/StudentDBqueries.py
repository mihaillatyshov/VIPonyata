from datetime import datetime

from .DBqueriesUtils import *


@ObjectListToDictList
def GetAvailableCourses(userId: int) -> list:
    return DBsession.query(Course).join(Course.users).filter(User.id == userId).all()


@GetDictFromSingleItem
def GetCourseById(courseId: int, userId: int):
    return DBsession.query(Course).filter_by(id=courseId).filter_by(user_id=userId).one_or_none()


def GetLessonsByCourseId(courseId: int, userId: int) -> list:
    return DBsession.query(Lesson).filter_by(course_id=courseId).filter_by(user_id=userId).all()


@GetDictFromSingleItem
def GetLessonById(lessonId: int, userId: int):
    return DBsession.query(Lesson).filter_by(lesson_id=lessonId).filter_by(user_id=userId).all()


@GetDictFromSingleItem
def GetDrillingByLessonId(lessonId: int, userId: int):
    return DBsession.query(Drilling).join(
        Drilling.lesson).filter(
        Lesson.id == lessonId).join(
        Lesson.users).filter(
        User.id == userId).one_or_none()


@GetDictFromSingleItem
def GetDrillingById(drillingId: int, userId: int):
    return DBsession.query(Drilling).filter_by(
        id=drillingId).join(
        Drilling.lesson).join(
        Lesson.users).filter(
        User.id == userId).one_or_none()


def GetDoneDrillingsByDrillingId(drillingId: int, userId: int) -> list:
    return DBsession.query(DoneDrilling).join(
        DoneDrilling.drilling).filter(
        Drilling.id == drillingId).join(
        Drilling.lesson).join(
        Lesson.users).filter(
        User.id == userId).all()


def AddNewDoneDrilling(tryNumber: int, drillingId: int, userId: int):
    DBsession.add(
        DoneDrilling(
            try_number=tryNumber, start_datetime=datetime.now(),
            user_id=userId, drilling_id=drillingId))
    DBsession.commit()


# @GetDictFromSingleItem
# def GetAssessmentByLessonId(lessonId: int, userId: int):
#    return GetSingleItem(DB.GetTableJson("assessment", where=f"LessonId = '{lessonId}'"))


# @GetDictFromSingleItem
# def GetHieroglyphByLessonId(lessonId: int, userId: int):
#    return GetSingleItem(DB.GetTableJson("hieroglyph", where=f"LessonId = '{lessonId}'"))
