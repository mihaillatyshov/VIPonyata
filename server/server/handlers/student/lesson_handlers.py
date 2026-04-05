import server.queries.StudentDBqueries as DBQS
from server.routes.routes_utils import get_current_user_id


def get_lessons_by_course_id(course_id: int):
    user_id = get_current_user_id()
    course = DBQS.get_course_by_id(course_id, user_id)
    return {
        "course": course,
        "items": DBQS.get_lessons_by_course_id(course_id, user_id),
        "unfinished_lessons": DBQS.get_unfinished_lessons_summary_by_course_id(course_id, user_id)
    }


def get_lesson_activities(lesson_id: int):
    user_id = get_current_user_id()
    lesson = DBQS.get_lesson_by_id(lesson_id, user_id)
    if drilling := DBQS.DrillingQueries.get_by_lesson_id(lesson_id, user_id):
        drilling.tries = DBQS.DrillingQueries.get_tries_by_activity_id(drilling.id, user_id)

    if assessment := DBQS.AssessmentQueries.get_by_lesson_id(lesson_id, user_id):
        assessment.tries = DBQS.AssessmentQueries.get_tries_by_activity_id(assessment.id, user_id)

    if hieroglyph := DBQS.HieroglyphQueries.get_by_lesson_id(lesson_id, user_id):
        hieroglyph.tries = DBQS.HieroglyphQueries.get_tries_by_activity_id(hieroglyph.id, user_id)

    if final_boss := DBQS.FinalBossQueries.get_by_lesson_id(lesson_id, user_id):
        final_boss.tries = DBQS.FinalBossQueries.get_tries_by_activity_id(final_boss.id, user_id)

    return {
        "lesson": lesson,
        "unfinished_lessons": DBQS.get_unfinished_lessons_summary_by_course_id(lesson.course_id, user_id),
        "items": {
            "drilling": drilling,
            "assessment": assessment,
            "hieroglyph": hieroglyph,
            "final_boss": final_boss
        }
    }
