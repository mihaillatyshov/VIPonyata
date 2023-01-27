from ...queries import StudentDBqueries as DBQS
from ..routes_utils import GetCurrentUserId


def getLessonsByCourseId(courseId: int):
    course = DBQS.GetCourseById(courseId, GetCurrentUserId())
    return {"course": course, "items": DBQS.GetLessonsByCourseId(courseId, GetCurrentUserId())}


def getLessonActivities(lessonId: int):
    lesson = DBQS.GetLessonById(lessonId, GetCurrentUserId())
    if dril := DBQS.DrillingQueries.GetByLessonId(lessonId, GetCurrentUserId()):
        dril.tries = DBQS.DrillingQueries.GetTriesByActivityId(                                                         #
            dril.id,                                                                                                    # type: ignore
            GetCurrentUserId()                                                                                          #
        )                                                                                                               #

    # if assessment := GetAssessmentByLessonId(id, GetCurrentUserId()):

    if hier := DBQS.HieroglyphQueries.GetByLessonId(lessonId, GetCurrentUserId()):
        hier.tries = DBQS.HieroglyphQueries.GetTriesByActivityId(                                                       #
            hier.id,                                                                                                    # type: ignore
            GetCurrentUserId()                                                                                          #
        )                                                                                                               #

    return {"lesson": lesson, "items": {"drilling": dril, "assessment": {}, "hieroglyph": hier}}
