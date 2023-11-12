from flask import request
from server.models.utils import validate_req

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidRequestJson
from server.models.dictionary import DictionaryCreateReq


def get_dictionary() -> dict:
    return {"dictionary": DBQT.get_dictionary()}


def create_dictionary() -> dict:
    dictionary_req_data = validate_req(DictionaryCreateReq, request.json)

    return {"words": DBQT.create_or_get_dictionary(dictionary_req_data)}


def add_img_to_dictionary(id: int) -> dict:

    if not request.json:
        raise InvalidRequestJson()

    url = request.json.get("url")
    if not isinstance(url, str):
        raise InvalidRequestJson()

    DBQT.add_img_to_dictionary(id, url)

    return {"message": "ok"}
