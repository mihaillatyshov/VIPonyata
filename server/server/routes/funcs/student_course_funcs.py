from ...queries import StudentDBqueries as DBQS
from ..routes_utils import GetCurrentUserId


def getAllCourses():
    return {"items": DBQS.GetAvailableCourses(GetCurrentUserId())}


def getLessonsByCourseId(courseId: int):
    if course := DBQS.GetCourseById(courseId, GetCurrentUserId()):
        return {"course": course, "items": DBQS.GetLessonsByCourseId(courseId, GetCurrentUserId())}

    return {"course": None, "items": None}, 403
