from .DBqueriesUtils import *


def GetCourses() -> list:
    return DBsession.query(Course).all()
    # return DB.GetTableJson("courses")


@GetDictFromSingleItem
def GetCourseById(courseId: int):
    return DBsession.query(Course).filter_by(id=courseId).one_or_none()
    # return GetSingleItem(DB.GetTableJson("courses", where=f"Id='{courseId}'"))


def GetLessonsByCourseId(courseId: int) -> list:
    return DBsession.query(Lesson).filter_by(course_id=courseId).all()
    # return DB.GetTableJson("lessons", where=f"CourseId='{courseId}'")


@GetDictFromSingleItem
def GetLessonById(lessonId: int) -> dict:
    return DBsession.query(Lesson).filter_by(id=lessonId).one_or_none()
    # return GetSingleItem(DB.GetTableJson("lessons", where=f"Id='{lessonId}'"))


@GetDictFromSingleItem
def GetDrillingByLessonId(lessondId: int) -> dict:
    return DBsession.query(Drilling).filter_by(lesson_id=lessondId).one_or_none()
    # return GetSingleItem(DB.GetTableJson("drillings", where=f"LessonId = '{lessondId}'"))


@GetDictFromSingleItem
def GetAssessmentByLessonId(lessondId: int) -> dict:
    return {}
    # return GetSingleItem(DB.GetTableJson("assessment", where=f"LessonId = '{lessondId}'"))


@GetDictFromSingleItem
def GetHieroglyphByLessonId(lessondId: int) -> dict:
    return {}
    # return GetSingleItem(DB.GetTableJson("hieroglyph", where=f"LessonId = '{lessondId}'"))
