import server.queries.TeacherDBqueries as DBQT


def getLessonsByCourseId(courseId: int):
    if course := DBQT.GetCourseById(courseId):
        return {"course": course, "items": DBQT.GetLessonsByCourseId(courseId)}

    return {"course": None, "items": None}, 403


def getLessonActivities(lessonId: int):
    if lesson := DBQT.GetLessonById(lessonId):
        drilling = lesson.drilling
        #assesment = GetAssessmentByLessonId(id)
        #hieroglyph = GetHieroglyphByLessonId(id)

        return {"lesson": lesson, "items": {"drilling": drilling}}

    return {"lesson": None, "items": None}, 403
