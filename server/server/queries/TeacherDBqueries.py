from .DBqueriesUtils import *


def GetCourses() -> list:
    return DB.GetTableJson("courses")


def GetCourseById(courseId: int) -> dict:
    return GetSingleItem(DB.GetTableJson("courses", where=f"Id='{courseId}'"))


def GetLessonsByCourseId(courseId: int) -> list:
    return DB.GetTableJson("lessons", where=f"CourseId='{courseId}'")


def GetLessonById(lessonId: int) -> dict:
    return GetSingleItem(DB.GetTableJson("lessons", where=f"Id='{lessonId}'"))


def GetDrillingByLessonId(lessondId: int) -> dict:
    return GetSingleItem(DB.GetTableJson("drillings", where=f"LessonId = '{lessondId}'"))


def GetAssessmentByLessonId(lessondId: int) -> dict:
    return GetSingleItem(DB.GetTableJson("assessment", where=f"LessonId = '{lessondId}'"))


def GetHieroglyphByLessonId(lessondId: int) -> dict:
    return GetSingleItem(DB.GetTableJson("hieroglyph", where=f"LessonId = '{lessondId}'"))
