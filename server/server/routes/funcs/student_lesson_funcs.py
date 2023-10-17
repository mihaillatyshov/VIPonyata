import server.queries.StudentDBqueries as DBQS
from server.routes.routes_utils import get_current_user_id


def get_lessons_by_course_id(course_id: int):
    course = DBQS.get_course_by_id(course_id, get_current_user_id())
    return {"course": course, "items": DBQS.get_lessons_by_course_id(course_id, get_current_user_id())}


def get_lesson_activities(lesson_id: int):
    lesson = DBQS.get_lesson_by_id(lesson_id, get_current_user_id())
    if drilling := DBQS.DrillingQueries.get_by_lesson_id(lesson_id, get_current_user_id()):
        drilling.tries = DBQS.DrillingQueries.GetTriesByActivityId(drilling.id, get_current_user_id())

    if assessment := DBQS.AssessmentQueries.get_by_lesson_id(lesson_id, get_current_user_id()):
        assessment.tries = DBQS.AssessmentQueries.GetTriesByActivityId(assessment.id, get_current_user_id())

    if hieroglyph := DBQS.HieroglyphQueries.get_by_lesson_id(lesson_id, get_current_user_id()):
        hieroglyph.tries = DBQS.HieroglyphQueries.GetTriesByActivityId(hieroglyph.id, get_current_user_id())

    if final_boss := DBQS.FinalBossQueries.get_by_lesson_id(lesson_id, get_current_user_id()):
        final_boss.tries = DBQS.FinalBossQueries.GetTriesByActivityId(final_boss.id, get_current_user_id())

    return {"lesson": lesson,
            "items": {"drilling": drilling,
                      "assessment": assessment,
                      "hieroglyph": hieroglyph,
                      "final_boss": final_boss}}
