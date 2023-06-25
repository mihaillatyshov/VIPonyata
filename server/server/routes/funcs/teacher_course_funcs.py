import server.queries.TeacherDBqueries as DBQT


def getAllCourses():
    return {"items": DBQT.GetCourses()}
