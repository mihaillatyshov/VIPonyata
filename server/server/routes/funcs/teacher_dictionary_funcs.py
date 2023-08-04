import server.queries.TeacherDBqueries as DBQT


def get_dictionary() -> dict:
    return {"dictionary": DBQT.get_dictionary()}
