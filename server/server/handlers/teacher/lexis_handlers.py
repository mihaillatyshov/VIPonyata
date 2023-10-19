from typing import Generic

from flask import request

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.models.db_models import Drilling, DrillingCard, DrillingTry, Hieroglyph, HieroglyphCard, HieroglyphTry, LexisCardType, LexisTryType, LexisType
from server.models.lexis import LexisCardCreateReq, LexisCreateReq


def get_lexis_data(lexis_type: type[LexisType]) -> DBQT.LexisQueries:
    if lexis_type == Drilling:
        return DBQT.DrillingQueries
    if lexis_type == Hieroglyph:
        return DBQT.HieroglyphQueries

    raise InvalidAPIUsage("Check server get_lexis_data()", 500)


class LexisHandlers(Generic[LexisType, LexisTryType, LexisCardType]):
    _activity_queries: DBQT.LexisQueries[LexisType, LexisTryType, LexisCardType]

    def __init__(self, lexis_type: type[LexisType]):
        self._activity_queries = get_lexis_data(lexis_type)

    def GetById(self, activityId: int):
        return {"lexis": self._activity_queries.GetById(activityId)}

    def create(self, lesson_id: int):
        if not request.json:
            raise InvalidRequestJson()

        lesson = DBQT.get_lesson_by_id(lesson_id)
        if lesson is None:
            raise InvalidAPIUsage("No lesson in db!", 404)

        if self._activity_queries.get_by_lesson_id(lesson.id) is not None:
            raise InvalidAPIUsage("Lexis exists!", 403, {"lesson_id": lesson_id})

        cards_data = LexisCardCreateReq(cards=request.json.get("cards"))

        lexis_data = LexisCreateReq(**request.json.get("lexis"))
        lexis = self._activity_queries.create(lesson_id, lexis_data)

        self._activity_queries.create_cards(lexis.id, cards_data)

        return {"lexis": lexis}


DrillingHandlers = LexisHandlers[Drilling, DrillingTry, DrillingCard](Drilling)
HieroglyphHandlers = LexisHandlers[Hieroglyph, HieroglyphTry, HieroglyphCard](Hieroglyph)
