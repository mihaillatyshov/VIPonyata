from ...queries import StudentDBqueries as DBQS
from ..routes_utils import GetCurrentUserId


def getLessonsByCourseId(courseId: int):
    course = DBQS.GetCourseById(courseId, GetCurrentUserId())
    return {"course": course, "items": DBQS.GetLessonsByCourseId(courseId, GetCurrentUserId())}


def getLessonActivities(lessonId: int):
    lesson = DBQS.GetLessonById(lessonId, GetCurrentUserId())
    if dril := DBQS.DrillingQueries.GetLexisByLessonId(lessonId, GetCurrentUserId()):
        dril.tries = DBQS.DrillingQueries.GetLexisTriesByLexisId(dril.id, GetCurrentUserId())                           # type: ignore

    # if assessment := GetAssessmentByLessonId(id, GetCurrentUserId()):

    if hier := DBQS.HieroglyphQueries.GetLexisByLessonId(lessonId, GetCurrentUserId()):
        hier.tries = DBQS.HieroglyphQueries.GetLexisTriesByLexisId(hier.id, GetCurrentUserId())                         # type: ignore

    return {"lesson": lesson, "items": {"drilling": dril, "assessment": {}, "hieroglyph": hier}}
