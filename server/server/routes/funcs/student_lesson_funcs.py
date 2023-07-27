import server.queries.StudentDBqueries as DBQS
from ..routes_utils import GetCurrentUserId


def getLessonsByCourseId(courseId: int):
    course = DBQS.GetCourseById(courseId, GetCurrentUserId())
    return {"course": course, "items": DBQS.GetLessonsByCourseId(courseId, GetCurrentUserId())}


def getLessonActivities(lessonId: int):
    lesson = DBQS.GetLessonById(lessonId, GetCurrentUserId())
    if dril := DBQS.DrillingQueries.GetByLessonId(lessonId, GetCurrentUserId()):
        dril.tries = DBQS.DrillingQueries.GetTriesByActivityId(dril.id, GetCurrentUserId())

    if asse := DBQS.AssessmentQueries.GetByLessonId(lessonId, GetCurrentUserId()):
        asse.tries = DBQS.AssessmentQueries.GetTriesByActivityId(asse.id, GetCurrentUserId())

    if hier := DBQS.HieroglyphQueries.GetByLessonId(lessonId, GetCurrentUserId()):
        hier.tries = DBQS.HieroglyphQueries.GetTriesByActivityId(hier.id, GetCurrentUserId())

    return {"lesson": lesson, "items": {"drilling": dril, "assessment": asse, "hieroglyph": hier}}
