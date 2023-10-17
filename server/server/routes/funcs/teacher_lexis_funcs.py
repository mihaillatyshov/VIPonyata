from typing import Generic

from flask import request

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.models.db_models import Drilling, Hieroglyph, LexisType
from server.models.lexis import LexisCardCreateReq, LexisCreateReq


def get_lexis_data(lexis_type: type[LexisType]) -> tuple[DBQT.LexisQueries, str]:
    if lexis_type == Drilling:
        return DBQT.DrillingQueries, "drilling"
    if lexis_type == Hieroglyph:
        return DBQT.HieroglyphQueries, "hieroglyph"

    raise InvalidAPIUsage("Check server GetLexisData()", 500)


class LexisFuncs(Generic[LexisType]):
    lexis_queries: DBQT.LexisQueries
    lexis_type: type[LexisType]
    lexis_name: str

    def __init__(self, lexis_type: type[LexisType]):
        self.lexis_type = lexis_type
        self.lexis_queries, self.lexis_name = get_lexis_data(lexis_type)

    def GetById(self, activityId: int):
        return {"lexis": self.lexis_queries.GetById(activityId)}

    def create(self, lesson_id: int):
        if not request.json:
            raise InvalidRequestJson()

        lesson = DBQT.get_lesson_by_id(lesson_id)
        if lesson is None:
            raise InvalidAPIUsage("No lesson in db!", 404)

        if self.lexis_queries.get_by_lesson_id(lesson.id) is not None:
            raise InvalidAPIUsage("Lexis exists!", 403, {"lesson_id": lesson_id})

        cards_data = LexisCardCreateReq(cards=request.json.get("cards"))

        lexis_data = LexisCreateReq(**request.json.get("lexis"))
        lexis = self.lexis_queries.create(lesson_id, lexis_data)

        self.lexis_queries.create_cards(lexis.id, cards_data)

        return {"lexis": lexis}


DrillingFuncs = LexisFuncs(Drilling)
HieroglyphFuncs = LexisFuncs(Hieroglyph)
