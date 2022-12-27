from datetime import datetime

from .DBqueriesUtils import *


def GetAvailableCourses(userId: int) -> list:
    return DB.GetTablesJson({
        "courses": {"elements": "ALL"},
        "usercourses": {}},
        where=f"courses.Id = usercourses.CourseId AND usercourses.UserId = '{userId}'")


def GetCourseById(courseId: int, userId: int) -> dict:
    return GetSingleItem(DB.GetTablesJson({
        "courses": {"elements": "ALL"},
        "usercourses": {}},
        where=f"courses.Id = usercourses.CourseId AND courses.Id = '{courseId}' AND usercourses.UserId = '{userId}'"))


def GetLessonsByCourseId(courseId: int, userId: int) -> list:
    return DB.GetTablesJson(
        {"lessons": {"elements": "ALL"},
         "userlessons": {}},
        where=f"lessons.Id = userlessons.LessonId AND lessons.CourseId = '{courseId}' AND userlessons.UserId = '{userId}'")


def GetLessonById(lessonId: int, userId: int) -> dict:
    return GetSingleItem(DB.GetTablesJson({
        "lessons": {"elements": "ALL"},
        "userlessons": {}},
        where=f"lessons.Id = userlessons.LessonId AND lessons.Id = '{lessonId}' AND userlessons.UserId = '{userId}'"))


def GetDrillingByLessonId(lessonId: int, userId: int) -> dict:
    return GetSingleItem(DB.GetTableJson("drillings", where=f"LessonId = '{lessonId}'"))


def GetDrillingById(drillingId: int, userId: int) -> dict:
    return GetSingleItem(DB.GetTablesJson({
        "drillings": {"elements": "ALL"},
        "userlessons": {}},
        where=f"drillings.Id = '{drillingId}' AND drillings.LessonId = userlessons.LessonId AND userlessons.UserId = '{userId}'"))


def GetDoneDrillingsByDrillingId(drillingId: int, userId: int) -> list:
    return DB.GetTableJson("donedrillings", where=f"DrillingId='{drillingId}' AND UserId='{userId}' ORDER BY TryNumber")


def AddNewDoneDrilling(tryNumber: int, drillingId: int, userId: int):
    DB.AddTableElement("donedrillings", {
        "TryNumber": tryNumber,
        "StartTime": datetime.now(),
        "UserId": userId,
        "DrillingId": drillingId})


def GetAssessmentByLessonId(lessonId: int, userId: int) -> dict:
    return GetSingleItem(DB.GetTableJson("assessment", where=f"LessonId = '{lessonId}'"))


def GetHieroglyphByLessonId(lessonId: int, userId: int) -> dict:
    return GetSingleItem(DB.GetTableJson("hieroglyph", where=f"LessonId = '{lessonId}'"))
