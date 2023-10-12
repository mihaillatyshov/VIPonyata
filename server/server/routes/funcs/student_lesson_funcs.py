import server.queries.StudentDBqueries as DBQS
from server.routes.routes_utils import get_current_user_id


def get_lessons_by_course_id(course_id: int):
    course = DBQS.get_course_by_id(course_id, get_current_user_id())
    return {"course": course, "items": DBQS.get_lessons_by_course_id(course_id, get_current_user_id())}


def get_lesson_activities(lesson_id: int):
    lesson = DBQS.get_lesson_by_id(lesson_id, get_current_user_id())
    if dril := DBQS.DrillingQueries.GetByLessonId(lesson_id, get_current_user_id()):
        dril.tries = DBQS.DrillingQueries.GetTriesByActivityId(dril.id, get_current_user_id())

    if asse := DBQS.AssessmentQueries.GetByLessonId(lesson_id, get_current_user_id()):
        asse.tries = DBQS.AssessmentQueries.GetTriesByActivityId(asse.id, get_current_user_id())

    if hier := DBQS.HieroglyphQueries.GetByLessonId(lesson_id, get_current_user_id()):
        hier.tries = DBQS.HieroglyphQueries.GetTriesByActivityId(hier.id, get_current_user_id())

    return {"lesson": lesson, "items": {"drilling": dril, "assessment": asse, "hieroglyph": hier}}
