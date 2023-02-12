from ...queries import TeacherDBqueries as DBQT
from ...db_models import LexisType, Drilling, Hieroglyph
from ...ApiExceptions import InvalidAPIUsage


def GetLexisData(lexis_type: LexisType) -> tuple[DBQT.LexisQueries, str]:
    if lexis_type == Drilling:
        return DBQT.DrillingQueries, "drilling"
    if lexis_type == Hieroglyph:
        return DBQT.HieroglyphQueries, "hieroglyph"

    raise InvalidAPIUsage("Check server GetLexisData()", 500)


class LexisFuncs:
    lexisQueries: DBQT.LexisQueries
    lexisName: str

    def __init__(self, lexis_type: LexisType):
        self.lexisQueries, self.lexisName = GetLexisData(lexis_type)

    def GetById(self, lexisId: int):
        return DBQT.DrillingQueries.GetById(lexisId)


DrillingFuncs = LexisFuncs(Drilling)
HieroglyphFuncs = LexisFuncs(Hieroglyph)
