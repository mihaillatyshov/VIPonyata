from flask import request
from server.models.dictionary import DictionaryAssosiationReq, DictionaryImgReq
from server.models.utils import validate_req

import server.queries.StudentDBqueries as DBQS
from server.exceptions.ApiExceptions import InvalidRequestJson
from server.routes.routes_utils import GetCurrentUserId


def get_dictionary() -> dict:
    db_dictionary = DBQS.get_dictionary(GetCurrentUserId())
    result = []
    for dict_item, dict_association in db_dictionary:
        print(dict_item, dict_association)

        data = dict_item.__json__()
        data["association"] = dict_association.association
        if dict_association.img != None:
            data["img"] = dict_association.img

        result.append(data)

    return {"dictionary": result}


def add_img_to_dictionary(id: int) -> dict:
    img_req_data = validate_req(DictionaryImgReq, request.json, other_data={"dictionary_id": id})

    DBQS.add_img_to_dictionary(img_req_data, GetCurrentUserId())

    return {"message": "ok"}


def add_assosiation_to_dictionary(id: int):
    assosiation_req_data = validate_req(DictionaryAssosiationReq, request.json, other_data={"dictionary_id": id})

    DBQS.add_assosiation_to_dictionary(assosiation_req_data, GetCurrentUserId())

    return {"message": "ok"}
