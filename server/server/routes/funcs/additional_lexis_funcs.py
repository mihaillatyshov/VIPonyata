from ...ApiExceptions import InvalidAPIUsage
from ...db_models import Drilling, DrillingTry, Hieroglyph, HieroglyphTry, LexisType


class LexisTaskName:
    CARD = "card"
    FINDPAIR = "findpair"
    SCRAMBLE = "scramble"
    TRANSLATE = "translate"
    SPACE = "space"


LexisTaskNameList = [
    value for name, value in vars(LexisTaskName).items()
    if not callable(getattr(LexisTaskName, name)) and not name.startswith("__")
]


def GetLexisTypes(lexis_type: LexisType) -> tuple[Drilling, DrillingTry] | tuple[Hieroglyph, HieroglyphTry]:
    if lexis_type == Drilling:
        return Drilling, DrillingTry
    if lexis_type == Hieroglyph:
        return Hieroglyph, HieroglyphTry

    raise InvalidAPIUsage("Check server GetLexisData()", 500)
