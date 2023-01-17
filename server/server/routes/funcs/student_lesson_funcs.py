from ...queries import StudentDBqueries as DBQS
from ..routes_utils import GetCurrentUserId


def getLessonsByCourseId(courseId: int):
    course = DBQS.GetCourseById(courseId, GetCurrentUserId())
    return {"course": course, "items": DBQS.GetLessonsByCourseId(courseId, GetCurrentUserId())}


def getLessonActivities(lessonId: int):
    lesson = DBQS.GetLessonById(lessonId, GetCurrentUserId())
    if drilling := DBQS.GetDrillingByLessonId(lessonId, GetCurrentUserId()):
        drilling.tries = DBQS.GetDoneDrillingsByDrillingId(drilling.id, GetCurrentUserId())                             # type: ignore

    # if assessment := GetAssessmentByLessonId(id, GetCurrentUserId()):

    hieroglyph = {}
    #if hieroglyph := DBQS.GetHieroglyphByLessonId(lessonId, GetCurrentUserId()):
    #    hieroglyph.tries = DBQS.GetDoneHieroglyphsByHieroglyphId(hieroglyph.id, GetCurrentUserId())

    return {"lesson": lesson, "items": {"drilling": drilling, "assessment": {}, "hieroglyph": hieroglyph}}
