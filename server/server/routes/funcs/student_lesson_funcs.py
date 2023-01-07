from ...queries import StudentDBqueries as DBQS
from ..routes_utils import CalcTasksDeadline, GetCurrentUserId


def getLessonsByCourseId(courseId: int):
    if course := DBQS.GetCourseById(courseId, GetCurrentUserId()):
        return {"course": course, "items": DBQS.GetLessonsByCourseId(courseId, GetCurrentUserId())}

    return {"course": None, "items": None}, 403


def getLessonActivities(lessonId: int):
    if lesson := DBQS.GetLessonById(lessonId, GetCurrentUserId()):
        if drilling := DBQS.GetDrillingByLessonId(lessonId, GetCurrentUserId()):
            drilling.tries = DBQS.GetDoneDrillingsByDrillingId(
                drilling.id, GetCurrentUserId())                                                                        # type: ignore

            if drilling.time_limit and drilling.tries and drilling.tries[-1].end_datetime == None:
                drilling.deadline = CalcTasksDeadline(drilling.time_limit,                                              # type: ignore
                                                      drilling.tries[-1].start_datetime)                                # type: ignore

        # if assessment := GetAssessmentByLessonId(id, GetCurrentUserId()):
        # if hieroglyph := GetHieroglyphByLessonId(id, GetCurrentUserId()):

        return {"lesson": lesson, "items": {"drilling": drilling, "assessment": {}, "hieroglyph": {}}}

    return {"lesson": None, "items": None}, 403
