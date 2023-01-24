from ..db_models import Course, Drilling, Lesson
from .DBqueriesUtils import *


def GetCourses() -> list[Course]:
    return DBsession.query(Course).all()
    # return DB.GetTableJson("courses")


def GetCourseById(courseId: int) -> Course:
    return DBsession.query(Course).filter(Course.id == courseId).one_or_none()
    # return GetSingleItem(DB.GetTableJson("courses", where=f"Id='{courseId}'"))


def GetLessonsByCourseId(courseId: int) -> list[Lesson]:
    return DBsession.query(Lesson).filter(Lesson.course_id == courseId).all()
    # return DB.GetTableJson("lessons", where=f"CourseId='{courseId}'")


def GetLessonById(lessonId: int) -> Lesson:
    return DBsession.query(Lesson).filter(Lesson.id == lessonId).one_or_none()
    # return GetSingleItem(DB.GetTableJson("lessons", where=f"Id='{lessonId}'"))


def GetDrillingByLessonId(lessondId: int) -> Drilling:
    return DBsession.query(Drilling).filter(Drilling.lesson_id == lessondId).one_or_none()
    # return GetSingleItem(DB.GetTableJson("drillings", where=f"LessonId = '{lessondId}'"))


def GetDrillingById(drillingId: int) -> Drilling:
    return DBsession.query(Drilling).filter(Drilling.id == drillingId).one_or_none()


def GetAssessmentByLessonId(lessondId: int) -> dict:
    return {}
    # return GetSingleItem(DB.GetTableJson("assessment", where=f"LessonId = '{lessondId}'"))


def GetHieroglyphByLessonId(lessondId: int) -> dict:
    return {}
    # return GetSingleItem(DB.GetTableJson("hieroglyph", where=f"LessonId = '{lessondId}'"))
