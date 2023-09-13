import server.queries.TeacherDBqueries as DBQT


def get_notifications():
    return {"notifications": DBQT.get_notifications()}