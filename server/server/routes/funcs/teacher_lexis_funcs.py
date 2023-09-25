from flask import request

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.models.db_models import Drilling, DrillingCard, Hieroglyph, HieroglyphCard, LexisType, LexisCardType
from server.models.dictionary import DictionaryCreateReq
from server.models.lexis import LexisCreateReq


def get_lexis_data(lexis_type: LexisType) -> tuple[DBQT.LexisQueries, str]:
    if lexis_type == Drilling:
        return DBQT.DrillingQueries, "drilling"
    if lexis_type == Hieroglyph:
        return DBQT.HieroglyphQueries, "hieroglyph"

    raise InvalidAPIUsage("Check server GetLexisData()", 500)


class LexisFuncs:
    lexis_queries: DBQT.LexisQueries
    lexis_type: LexisType
    lexis_name: str

    def __init__(self, lexis_type: LexisType):
        self.lexis_type = lexis_type
        self.lexis_queries, self.lexis_name = get_lexis_data(lexis_type)

    def GetById(self, activityId: int):
        return {"lexis": self.lexis_queries.GetById(activityId)}

    def create(self, lesson_id: int):
        if not request.json:
            raise InvalidRequestJson()

        lesson = DBQT.GetLessonById(lesson_id)
        if lesson is None:
            raise InvalidAPIUsage("No lesson in db!", 404)

        if self.lexis_queries.GetByLessonId(lesson.id) is not None:
            raise InvalidAPIUsage("Lexis exists!", 403, {"lesson_id": lesson_id})                                       # TODO: add lexis id to redirect

        cards_data = LexisCardCreateReq(items=request.json.get("cards"))
        cards = DBQT.create_or_get_dictionary(dictionary_data)

        lexis_data = LexisCreateReq(**request.json.get("lexis"))
        lexis = self.lexis_queries.create(lesson_id, lexis_data)

        self.lexis_queries.create_cards(lexis.id, dictionary)

        return {"lexis": lexis}


DrillingFuncs = LexisFuncs(Drilling)
HieroglyphFuncs = LexisFuncs(Hieroglyph)
