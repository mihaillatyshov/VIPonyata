from sqlalchemy import delete, select, update

from server.common import DBsession
from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.models.db_models import ReviewDictionary, ReviewTopic, ReviewWord
from server.models.review import (ReviewDictionaryCreateReq, ReviewTopicCreateReq, ReviewTrainingSessionResultsReq,
                                  ReviewWordCreateReq, ReviewWordMemoryStateUpdateReq, ReviewWordUpdateReq)

REVIEW_WORD_STAGE_FLOW: list[tuple[str, int]] = [
    (ReviewWord.Status.SHAKY, 1),
    (ReviewWord.Status.SHAKY, 2),
    (ReviewWord.Status.SHAKY, 3),
    (ReviewWord.Status.PASSIVE, 1),
    (ReviewWord.Status.PASSIVE, 2),
    (ReviewWord.Status.PASSIVE, 3),
    (ReviewWord.Status.ACTIVE, 1),
    (ReviewWord.Status.ACTIVE, 2),
    (ReviewWord.Status.ACTIVE, 3),
]

REVIEW_WORD_SESSION_RESULT_STEP = {
    "remember": 1,
    "partial": 0,
    "forgot": -1,
}


def _get_next_sort(items: list[ReviewDictionary] | list[ReviewTopic]) -> int:
    if len(items) == 0:
        return 10
    return max(item.sort for item in items) + 10


def _get_review_word_state_index(status: str, stage: int) -> int:
    for index, state in enumerate(REVIEW_WORD_STAGE_FLOW):
        if state == (status, stage):
            return index

    raise InvalidAPIUsage("Review word memory state is invalid", 500)


def _normalize_review_word_memory_state(word: ReviewWord):
    try:
        _get_review_word_state_index(word.status, word.stage)
    except InvalidAPIUsage:
        word.status = ReviewWord.Status.PASSIVE
        word.stage = 1


def _apply_review_training_result(word: ReviewWord, result: str):
    current_index = _get_review_word_state_index(word.status, word.stage)
    next_index = max(0, min(len(REVIEW_WORD_STAGE_FLOW) - 1, current_index + REVIEW_WORD_SESSION_RESULT_STEP[result]))
    word.status, word.stage = REVIEW_WORD_STAGE_FLOW[next_index]


def get_review_catalog(user_id: int) -> dict:
    with DBsession.begin() as session:
        dictionaries = session.scalars(
            select(ReviewDictionary).where(ReviewDictionary.owner_id == user_id).order_by(
                ReviewDictionary.sort).order_by(ReviewDictionary.id), ).all()
        dictionary_ids = [item.id for item in dictionaries]

        if len(dictionary_ids) == 0:
            return {"dictionaries": [], "topics": [], "words": []}

        topics = session.scalars(
            select(ReviewTopic).where(ReviewTopic.dictionary_id.in_(dictionary_ids)).order_by(
                ReviewTopic.sort).order_by(ReviewTopic.id), ).all()
        topic_ids = [item.id for item in topics]

        words = []
        if len(topic_ids) > 0:
            words = session.scalars(
                select(ReviewWord).where(ReviewWord.topic_id.in_(topic_ids)).order_by(ReviewWord.id), ).all()
            for word in words:
                _normalize_review_word_memory_state(word)

        return {
            "dictionaries": [item.__json__() for item in dictionaries],
            "topics": [item.__json__() for item in topics],
            "words": [item.__json__() for item in words],
        }


def create_review_dictionary(user_id: int, data: ReviewDictionaryCreateReq) -> ReviewDictionary:
    with DBsession.begin() as session:
        existing = session.scalars(
            select(ReviewDictionary).where(ReviewDictionary.owner_id == user_id).order_by(
                ReviewDictionary.sort).order_by(ReviewDictionary.id), ).all()
        review_dictionary = ReviewDictionary(
            title=data.title,
            sort=data.sort if data.sort != 500 else _get_next_sort(existing),
            owner_id=user_id,
        )
        session.add(review_dictionary)
        return review_dictionary


def update_review_dictionary(user_id: int, dictionary_id: int, data: ReviewDictionaryCreateReq):
    with DBsession.begin() as session:
        query = select(ReviewDictionary).where(ReviewDictionary.id == dictionary_id).where(
            ReviewDictionary.owner_id == user_id)
        review_dictionary = session.scalars(query).one_or_none()
        if review_dictionary is None:
            raise InvalidAPIUsage("Review dictionary not found", 404)

        session.execute(
            update(ReviewDictionary).where(ReviewDictionary.id == dictionary_id).values(title=data.title,
                                                                                        sort=data.sort), )


def delete_review_dictionary(user_id: int, dictionary_id: int):
    with DBsession.begin() as session:
        review_dictionary = session.scalars(
            select(ReviewDictionary).where(ReviewDictionary.id == dictionary_id).where(
                ReviewDictionary.owner_id == user_id), ).one_or_none()
        if review_dictionary is None:
            raise InvalidAPIUsage("Review dictionary not found", 404)

        session.delete(review_dictionary)


def create_review_topic(user_id: int, data: ReviewTopicCreateReq) -> ReviewTopic:
    if data.dictionary_id is None:
        raise InvalidAPIUsage("dictionary_id is required", 400)

    with DBsession.begin() as session:
        review_dictionary = session.scalars(
            select(ReviewDictionary).where(ReviewDictionary.id == data.dictionary_id).where(
                ReviewDictionary.owner_id == user_id), ).one_or_none()
        if review_dictionary is None:
            raise InvalidAPIUsage("Review dictionary not found", 404)

        topics = session.scalars(
            select(ReviewTopic).where(ReviewTopic.dictionary_id == data.dictionary_id).order_by(
                ReviewTopic.sort).order_by(ReviewTopic.id), ).all()
        topic = ReviewTopic(
            dictionary_id=data.dictionary_id,
            title=data.title,
            sort=data.sort if data.sort != 500 else _get_next_sort(topics),
        )
        session.add(topic)
        return topic


def update_review_topic(user_id: int, topic_id: int, data: ReviewTopicCreateReq):
    with DBsession.begin() as session:
        topic = session.scalars(
            select(ReviewTopic).join(ReviewTopic.dictionary).where(ReviewTopic.id == topic_id).where(
                ReviewDictionary.owner_id == user_id), ).one_or_none()
        if topic is None:
            raise InvalidAPIUsage("Review topic not found", 404)

        session.execute(
            update(ReviewTopic).where(ReviewTopic.id == topic_id).values(title=data.title, sort=data.sort), )


def delete_review_topic(user_id: int, topic_id: int):
    with DBsession.begin() as session:
        topic = session.scalars(
            select(ReviewTopic).join(ReviewTopic.dictionary).where(ReviewTopic.id == topic_id).where(
                ReviewDictionary.owner_id == user_id), ).one_or_none()
        if topic is None:
            raise InvalidAPIUsage("Review topic not found", 404)

        session.delete(topic)


def create_review_word(user_id: int, data: ReviewWordCreateReq) -> ReviewWord:
    with DBsession.begin() as session:
        topic = session.scalars(
            select(ReviewTopic).join(ReviewTopic.dictionary).where(ReviewTopic.id == data.topic_id).where(
                ReviewDictionary.owner_id == user_id), ).one_or_none()
        if topic is None:
            raise InvalidAPIUsage("Review topic not found", 404)

        word = ReviewWord(
            topic_id=data.topic_id,
            source=data.source,
            word_jp=data.word_jp,
            ru=data.ru,
            note=data.note.strip() if isinstance(data.note, str) else data.note,
            examples=data.examples.strip() if isinstance(data.examples, str) else data.examples,
            status=ReviewWord.Status.PASSIVE,
            stage=1,
            is_frozen=False,
        )
        session.add(word)
        return word


def update_review_word(user_id: int, word_id: int, data: ReviewWordUpdateReq):
    with DBsession.begin() as session:
        word = session.scalars(
            select(ReviewWord).join(ReviewWord.topic).join(ReviewTopic.dictionary).where(
                ReviewWord.id == word_id).where(ReviewDictionary.owner_id == user_id), ).one_or_none()
        if word is None:
            raise InvalidAPIUsage("Review word not found", 404)

        _normalize_review_word_memory_state(word)

        session.execute(
            update(ReviewWord).where(ReviewWord.id == word_id).values(
                source=data.source,
                word_jp=data.word_jp,
                ru=data.ru,
                note=data.note.strip() if isinstance(data.note, str) else data.note,
                examples=data.examples.strip() if isinstance(data.examples, str) else data.examples,
            ), )


def update_review_word_memory_state(user_id: int, word_id: int, data: ReviewWordMemoryStateUpdateReq) -> ReviewWord:
    with DBsession.begin() as session:
        word = session.scalars(
            select(ReviewWord).join(ReviewWord.topic).join(ReviewTopic.dictionary).where(
                ReviewWord.id == word_id).where(ReviewDictionary.owner_id == user_id), ).one_or_none()
        if word is None:
            raise InvalidAPIUsage("Review word not found", 404)

        _normalize_review_word_memory_state(word)
        word.is_frozen = data.is_frozen
        session.flush()
        return word


def apply_review_training_session_results(user_id: int, data: ReviewTrainingSessionResultsReq) -> list[ReviewWord]:
    if len(data.results) == 0:
        return []

    result_by_word_id = {item.word_id: item.result for item in data.results}

    with DBsession.begin() as session:
        words = session.scalars(
            select(ReviewWord).join(ReviewWord.topic).join(ReviewTopic.dictionary).where(
                ReviewWord.id.in_(result_by_word_id.keys())).where(ReviewDictionary.owner_id == user_id), ).all()

        if len(words) != len(result_by_word_id):
            raise InvalidAPIUsage("Review word not found", 404)

        for word in words:
            _normalize_review_word_memory_state(word)
            _apply_review_training_result(word, result_by_word_id[word.id])

        session.flush()
        return words


def delete_review_word(user_id: int, word_id: int):
    with DBsession.begin() as session:
        word = session.scalars(
            select(ReviewWord).join(ReviewWord.topic).join(ReviewTopic.dictionary).where(
                ReviewWord.id == word_id).where(ReviewDictionary.owner_id == user_id), ).one_or_none()
        if word is None:
            raise InvalidAPIUsage("Review word not found", 404)

        session.execute(delete(ReviewWord).where(ReviewWord.id == word_id))
