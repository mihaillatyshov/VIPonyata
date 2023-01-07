from ...queries import TeacherDBqueries as DBQT


def getDrillingById(drillingId: int):
    drilling = DBQT.GetDrillingById(drillingId)
    return {"drilling": drilling}
