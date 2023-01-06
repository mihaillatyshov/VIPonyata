from ...queries import TeacherDBqueries as DBQT


def getAllCourses():
    return {"items": DBQT.GetCourses()}


def getLessonsByCourseId(courseId: int):
    if course := DBQT.GetCourseById(courseId):
        return {"course": course, "items": DBQT.GetLessonsByCourseId(courseId)}

    return {"course": None, "items": None}, 403
