import server.queries.StudentDBqueries as DBQS
from server.routes.routes_utils import GetCurrentUserId


def get_lessons_by_course_id(course_id: int):
    course = DBQS.get_course_by_id(course_id, GetCurrentUserId())
    return {"course": course, "items": DBQS.get_lessons_by_course_id(course_id, GetCurrentUserId())}


def getLessonActivities(lessonId: int):
    lesson = DBQS.GetLessonById(lessonId, GetCurrentUserId())
    if dril := DBQS.DrillingQueries.GetByLessonId(lessonId, GetCurrentUserId()):
        dril.tries = DBQS.DrillingQueries.GetTriesByActivityId(dril.id, GetCurrentUserId())

    if asse := DBQS.AssessmentQueries.GetByLessonId(lessonId, GetCurrentUserId()):
        asse.tries = DBQS.AssessmentQueries.GetTriesByActivityId(asse.id, GetCurrentUserId())

    if hier := DBQS.HieroglyphQueries.GetByLessonId(lessonId, GetCurrentUserId()):
        hier.tries = DBQS.HieroglyphQueries.GetTriesByActivityId(hier.id, GetCurrentUserId())

    return {"lesson": lesson, "items": {"drilling": dril, "assessment": asse, "hieroglyph": hier}}
