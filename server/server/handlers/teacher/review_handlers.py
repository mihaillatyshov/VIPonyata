from flask import request

import server.queries.ReviewDBqueries as DBQR
from server.models.review import ReviewDictionaryCreateReq, ReviewTopicCreateReq, ReviewWordCreateReq, ReviewWordUpdateReq
from server.models.utils import validate_req
from server.routes.routes_utils import get_current_user_id


def get_review_catalog() -> dict:
    user_id = get_current_user_id()
    return DBQR.get_review_catalog(user_id)


def create_review_dictionary() -> dict:
    user_id = get_current_user_id()
    data = validate_req(ReviewDictionaryCreateReq, request.json)
    review_dictionary = DBQR.create_review_dictionary(user_id, data)
    return {"dictionary": review_dictionary.__json__()}


def update_review_dictionary(dictionary_id: int) -> dict:
    user_id = get_current_user_id()
    data = validate_req(ReviewDictionaryCreateReq, request.json)
    DBQR.update_review_dictionary(user_id, dictionary_id, data)
    return {"message": "ok"}


def delete_review_dictionary(dictionary_id: int) -> dict:
    user_id = get_current_user_id()
    DBQR.delete_review_dictionary(user_id, dictionary_id)
    return {"message": "ok"}


def create_review_topic() -> dict:
    user_id = get_current_user_id()
    data = validate_req(ReviewTopicCreateReq, request.json)
    topic = DBQR.create_review_topic(user_id, data)
    return {"topic": topic.__json__()}


def update_review_topic(topic_id: int) -> dict:
    user_id = get_current_user_id()
    data = validate_req(ReviewTopicCreateReq, request.json)
    DBQR.update_review_topic(user_id, topic_id, data)
    return {"message": "ok"}


def delete_review_topic(topic_id: int) -> dict:
    user_id = get_current_user_id()
    DBQR.delete_review_topic(user_id, topic_id)
    return {"message": "ok"}


def create_review_word() -> dict:
    user_id = get_current_user_id()
    data = validate_req(ReviewWordCreateReq, request.json)
    word = DBQR.create_review_word(user_id, data)
    return {"word": word.__json__()}


def update_review_word(word_id: int) -> dict:
    user_id = get_current_user_id()
    data = validate_req(ReviewWordUpdateReq, request.json)
    DBQR.update_review_word(user_id, word_id, data)
    return {"message": "ok"}


def delete_review_word(word_id: int) -> dict:
    user_id = get_current_user_id()
    DBQR.delete_review_word(user_id, word_id)
    return {"message": "ok"}
