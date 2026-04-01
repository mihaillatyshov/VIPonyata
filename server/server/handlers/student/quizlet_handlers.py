from flask import request

import server.queries.StudentDBqueries as DBQS
from server.models.quizlet import (QuizletEndSessionReq, QuizletFlashcardAnswerReq, QuizletPairAttemptReq,
                                   QuizletPersonalLessonCreateReq, QuizletRetryIncorrectReq, QuizletSaveProgressReq,
                                   QuizletStartSessionReq, QuizletSubgroupCreateReq, QuizletWordCreateReq,
                                   QuizletWordUpdateReq)
from server.models.utils import validate_req
from server.routes.routes_utils import get_current_user_id


def get_quizlet_catalog() -> dict:
    groups = DBQS.get_quizlet_groups()
    group_ids = [group.id for group in groups]
    subgroups = DBQS.get_quizlet_subgroups(group_ids)
    subgroup_ids = [subgroup.id for subgroup in subgroups]
    words_rows = DBQS.get_quizlet_words(subgroup_ids)

    words = [word.__json__() for _, word in words_rows]
    subgroup_words = [{"subgroup_id": link.subgroup_id, "word_id": link.word_id} for link, _ in words_rows]

    return {
        "groups": [group.__json__() for group in groups],
        "subgroups": [subgroup.__json__() for subgroup in subgroups],
        "subgroup_words": subgroup_words,
        "words": words,
    }


def get_personal_quizlet() -> dict:
    user_id = get_current_user_id()
    lesson = DBQS.get_personal_quizlet_lesson(user_id)
    subgroups = DBQS.get_personal_quizlet_subgroups(user_id)
    words = DBQS.get_personal_quizlet_words(user_id)

    return {
        "lesson": None if lesson is None else lesson.__json__(),
        "subgroups": [subgroup.__json__() for subgroup in subgroups],
        "words": [word.__json__() for word in words],
    }


def create_personal_quizlet_lesson() -> dict:
    user_id = get_current_user_id()
    data = validate_req(QuizletPersonalLessonCreateReq, request.json)
    lesson = DBQS.create_personal_quizlet_lesson(user_id, data)
    return {"lesson": lesson}


def update_personal_quizlet_lesson() -> dict:
    user_id = get_current_user_id()
    data = validate_req(QuizletPersonalLessonCreateReq, request.json)
    DBQS.update_personal_quizlet_lesson(user_id, data)
    return {"message": "ok"}


def create_personal_quizlet_subgroup() -> dict:
    user_id = get_current_user_id()
    data = validate_req(QuizletSubgroupCreateReq, request.json)
    subgroup = DBQS.create_personal_quizlet_subgroup(user_id, data)
    return {"subgroup": subgroup}


def update_personal_quizlet_subgroup(subgroup_id: int) -> dict:
    user_id = get_current_user_id()
    data = validate_req(QuizletSubgroupCreateReq, request.json)
    DBQS.update_personal_quizlet_subgroup(user_id, subgroup_id, data)
    return {"message": "ok"}


def delete_personal_quizlet_subgroup(subgroup_id: int) -> dict:
    user_id = get_current_user_id()
    DBQS.delete_personal_quizlet_subgroup(user_id, subgroup_id)
    return {"message": "ok"}


def add_personal_quizlet_word() -> dict:
    user_id = get_current_user_id()
    data = validate_req(QuizletWordCreateReq, request.json)
    word = DBQS.add_personal_quizlet_word(user_id, data)
    return {"word": word}


def update_personal_quizlet_word(word_id: int) -> dict:
    user_id = get_current_user_id()
    data = validate_req(QuizletWordUpdateReq, request.json)
    DBQS.update_personal_quizlet_word(user_id, word_id, data)
    return {"message": "ok"}


def delete_personal_quizlet_word(word_id: int) -> dict:
    user_id = get_current_user_id()
    DBQS.delete_personal_quizlet_word(user_id, word_id)
    return {"message": "ok"}


def start_quizlet_session() -> dict:
    user_id = get_current_user_id()
    data = validate_req(QuizletStartSessionReq, request.json)
    session = DBQS.start_quizlet_session(user_id, data)
    return {"session": session}


def get_quizlet_session(session_id: int) -> dict:
    user_id = get_current_user_id()
    session = DBQS.get_quizlet_session(session_id, user_id)
    words = DBQS.get_quizlet_session_words(session_id)
    return {
        "session": session,
        "words": words,
    }


def mark_quizlet_pair_attempt(session_id: int) -> dict:
    user_id = get_current_user_id()
    data = validate_req(QuizletPairAttemptReq, request.json)
    is_correct = DBQS.mark_quizlet_pair_attempt(user_id, session_id, data.left_word_id, data.right_word_id)
    return {"is_correct": is_correct}


def mark_quizlet_flashcard_answer(session_id: int) -> dict:
    user_id = get_current_user_id()
    data = validate_req(QuizletFlashcardAnswerReq, request.json)
    DBQS.mark_quizlet_flashcard_answer(user_id, session_id, data)
    return {"message": "ok"}


def save_quizlet_progress(session_id: int) -> dict:
    user_id = get_current_user_id()
    data = validate_req(QuizletSaveProgressReq, request.json)
    DBQS.save_quizlet_progress(user_id, session_id, data)
    return {"message": "ok"}


def end_quizlet_session(session_id: int) -> dict:
    user_id = get_current_user_id()
    data = validate_req(QuizletEndSessionReq, request.json)
    session = DBQS.end_quizlet_session(user_id, session_id, data)
    return {"session": session}


def retry_quizlet_incorrect_words() -> dict:
    user_id = get_current_user_id()
    data = validate_req(QuizletRetryIncorrectReq, request.json)
    session = DBQS.retry_quizlet_incorrect_words(user_id, data)
    return {"session": session}


def get_quizlet_sessions_stats() -> dict:
    user_id = get_current_user_id()
    sessions = DBQS.get_quizlet_sessions_stats(user_id)
    return {"sessions": sessions}
