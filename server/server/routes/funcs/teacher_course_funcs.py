from ...queries import TeacherDBqueries as DBQT


def getAllCourses():
    return {"items": DBQT.GetCourses()}
