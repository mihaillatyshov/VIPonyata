from flask import request

import server.queries.StudentDBqueries as DBQS
from server.models.db_models import Dictionary, UserDictionary
from server.models.dictionary import DictionaryAssociationReq, DictionaryImgReq
from server.models.utils import validate_req
from server.routes.routes_utils import get_current_user_id


def combine_dictionary(dict_item: Dictionary, dict_user: UserDictionary) -> dict:
    data = dict_item.__json__()
    data["association"] = dict_user.association
    if dict_user.img != None:
        data["img"] = dict_user.img

    return data


def get_dictionary() -> dict:
    db_dictionary = DBQS.get_dictionary(get_current_user_id())
    result = []
    for dict_item, dict_user in db_dictionary:
        data = combine_dictionary(dict_item, dict_user)
        result.append(data)

    return {"dictionary": result}


def add_img_to_dictionary(id: int) -> dict:
    img_req_data = validate_req(DictionaryImgReq, request.json, other_data={"dictionary_id": id})

    DBQS.add_img_to_dictionary(img_req_data, get_current_user_id())

    return {"message": "ok"}


def add_association_to_dictionary(id: int) -> dict:
    association_req_data = validate_req(DictionaryAssociationReq, request.json, other_data={"dictionary_id": id})

    DBQS.add_association_to_dictionary(association_req_data, get_current_user_id())

    return {"message": "ok"}


def get_dictionary_count() -> dict:
    return {"count": DBQS.get_dictionary_count(get_current_user_id())}
