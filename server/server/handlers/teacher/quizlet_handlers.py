from flask import request

import server.queries.StudentDBqueries as DBQS
import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.models.quizlet import (QuizletGroupCreateReq, QuizletSubgroupCreateReq, QuizletWordCreateReq,
                                   QuizletAssignmentCreateReq, QuizletPersonalLessonCreateReq,
                                   QuizletWordsBatchCreateReq, QuizletWordUpdateReq, QuizletPersonalWordBatchReq)
from server.models.utils import validate_req
from server.routes.routes_utils import get_current_user_id


def _ensure_student_exists(student_id: int):
    students = DBQT.get_students_by_ids([student_id])
    if len(students) == 0:
        raise InvalidAPIUsage("Student not found", 404)


def _normalize_notification_title(title: str) -> str:
    normalized = title.replace("|", "/").replace("]]", "] ]").strip()
    return normalized if normalized else "Мой словарь"


def _build_quizlet_dictionary_edit_message(title: str, link: str) -> str:
    return f"Сэнсэй кое-что изменила в словаре [[quizlet_dict_link:{link}|{_normalize_notification_title(title)}]]"


def _build_quizlet_topic_created_message(title: str, link: str) -> str:
    return f"Сэнсэй создала новый список слов [[quizlet_topic_created:{link}|{_normalize_notification_title(title)}]]"


def _build_quizlet_topic_updated_message(title: str, link: str) -> str:
    return f"Сэнсэй кое-что изменила в [[quizlet_topic_updated:{link}|{_normalize_notification_title(title)}]]"


def _build_quizlet_topic_deleted_message(title: str, link: str) -> str:
    return f"Сэнсэй удалила [[quizlet_topic_deleted:{link}|{_normalize_notification_title(title)}]]"


def _notify_personal_quizlet_updated(student_id: int, title: str, link: str):
    DBQT.add_quizlet_personal_dictionary_notification(student_id, _build_quizlet_dictionary_edit_message(title, link))


def _notify_personal_quizlet_topic_created(student_id: int, title: str, link: str):
    DBQT.add_quizlet_personal_dictionary_notification(student_id, _build_quizlet_topic_created_message(title, link))


def _get_personal_subgroup_title(student_id: int, subgroup_id: int) -> str:
    subgroup = next((item for item in DBQS.get_personal_quizlet_subgroups(student_id) if item.id == subgroup_id), None)
    if subgroup is None:
        raise InvalidAPIUsage("Personal subgroup not found", 404)

    return subgroup.title


def _notify_personal_quizlet_batch_updated(student_id: int, subgroup_title: str, subgroup_id: int):
    """Отправить одно уведомление об изменении слов в теме"""
    message = _build_quizlet_topic_updated_message(subgroup_title, f"/quizlet/my-dictionary/topics/{subgroup_id}")
    DBQT.add_quizlet_personal_dictionary_notification(student_id, message)


def get_quizlet_groups() -> dict:
    groups = DBQT.get_quizlet_groups()
    group_ids = [group.id for group in groups]
    subgroups = DBQT.get_quizlet_subgroups_by_group_ids(group_ids)
    subgroup_ids = [subgroup.id for subgroup in subgroups]
    words_rows = DBQT.get_quizlet_words_by_subgroup_ids(subgroup_ids)

    words = [word.__json__() for _, word in words_rows]
    subgroup_words = [{"subgroup_id": link.subgroup_id, "word_id": link.word_id} for link, _ in words_rows]

    return {
        "groups": [group.__json__() for group in groups],
        "subgroups": [subgroup.__json__() for subgroup in subgroups],
        "subgroup_words": subgroup_words,
        "words": words,
    }


def create_quizlet_group() -> dict:
    data = validate_req(QuizletGroupCreateReq, request.json)
    group = DBQT.create_quizlet_group(data)
    return {"group": group.__json__()}


def update_quizlet_group(group_id: int) -> dict:
    data = validate_req(QuizletGroupCreateReq, request.json)
    DBQT.update_quizlet_group(group_id, data)
    return {"message": "ok"}


def delete_quizlet_group(group_id: int) -> dict:
    DBQT.delete_quizlet_group(group_id)
    return {"message": "ok"}


def create_quizlet_subgroup(group_id: int) -> dict:
    data = validate_req(QuizletSubgroupCreateReq, request.json)
    subgroup = DBQT.create_quizlet_subgroup(group_id, data)
    return {"subgroup": subgroup.__json__()}


def update_quizlet_subgroup(subgroup_id: int) -> dict:
    data = validate_req(QuizletSubgroupCreateReq, request.json)
    DBQT.update_quizlet_subgroup(subgroup_id, data)
    return {"message": "ok"}


def delete_quizlet_subgroup(subgroup_id: int) -> dict:
    DBQT.delete_quizlet_subgroup(subgroup_id)
    return {"message": "ok"}


def add_quizlet_word() -> dict:
    data = validate_req(QuizletWordCreateReq, request.json)
    word = DBQT.add_quizlet_word(data)
    return {"word": word.__json__()}


def batch_add_quizlet_words() -> dict:
    data = validate_req(QuizletWordsBatchCreateReq, request.json)
    words = DBQT.batch_add_quizlet_words(data)
    return {"words": [w.__json__() for w in words]}


def update_quizlet_word(word_id: int) -> dict:
    data = validate_req(QuizletWordUpdateReq, request.json)
    DBQT.update_quizlet_word(word_id, data)
    return {"message": "ok"}


def remove_quizlet_word_from_subgroup(subgroup_id: int, word_id: int) -> dict:
    DBQT.remove_quizlet_word_from_subgroup(subgroup_id, word_id)
    return {"message": "ok"}


def delete_quizlet_word(word_id: int) -> dict:
    DBQT.delete_quizlet_word(word_id)
    return {"message": "ok"}


def get_quizlet_assignment_options() -> dict:
    students = DBQT.get_all_students()

    return {
        "students": [student.__json__() for student in students],
    }


def get_students_personal_quizlet_cards() -> dict:
    students = DBQT.get_all_students()
    result = []
    for student in students:
        has_personal_dictionary = DBQS.get_personal_quizlet_lesson(student.id) is not None
        result.append({
            "id": student.id,
            "name": student.name,
            "nickname": student.nickname,
            "has_personal_dictionary": has_personal_dictionary,
        })

    return {"students": result}


def get_student_personal_quizlet(student_id: int) -> dict:
    _ensure_student_exists(student_id)
    lesson = DBQS.get_personal_quizlet_lesson(student_id)
    subgroups = DBQS.get_personal_quizlet_subgroups(student_id)
    words = DBQS.get_personal_quizlet_words(student_id)

    return {
        "lesson": None if lesson is None else lesson.__json__(),
        "subgroups": [subgroup.__json__() for subgroup in subgroups],
        "words": [word.__json__() for word in words],
    }


def create_student_personal_quizlet_lesson(student_id: int) -> dict:
    _ensure_student_exists(student_id)
    data = validate_req(QuizletPersonalLessonCreateReq, request.json)
    lesson = DBQS.create_personal_quizlet_lesson(student_id, data)
    _notify_personal_quizlet_updated(student_id, lesson.title, "/quizlet/my-dictionary")
    return {"lesson": lesson}


def update_student_personal_quizlet_lesson(student_id: int) -> dict:
    _ensure_student_exists(student_id)
    data = validate_req(QuizletPersonalLessonCreateReq, request.json)
    DBQS.update_personal_quizlet_lesson(student_id, data)
    _notify_personal_quizlet_updated(student_id, data.title, "/quizlet/my-dictionary")
    return {"message": "ok"}


def create_student_personal_quizlet_subgroup(student_id: int) -> dict:
    _ensure_student_exists(student_id)
    data = validate_req(QuizletSubgroupCreateReq, request.json)
    subgroup = DBQS.create_personal_quizlet_subgroup(student_id, data)
    _notify_personal_quizlet_topic_created(student_id, subgroup.title, f"/quizlet/my-dictionary/topics/{subgroup.id}")
    return {"subgroup": subgroup}


def update_student_personal_quizlet_subgroup(student_id: int, subgroup_id: int) -> dict:
    _ensure_student_exists(student_id)
    data = validate_req(QuizletSubgroupCreateReq, request.json)
    DBQS.update_personal_quizlet_subgroup(student_id, subgroup_id, data)
    _notify_personal_quizlet_updated(student_id, data.title, f"/quizlet/my-dictionary/topics/{subgroup_id}")
    return {"message": "ok"}


def delete_student_personal_quizlet_subgroup(student_id: int, subgroup_id: int) -> dict:
    _ensure_student_exists(student_id)
    subgroup_title = _get_personal_subgroup_title(student_id, subgroup_id)
    DBQS.delete_personal_quizlet_subgroup(student_id, subgroup_id)
    DBQT.add_quizlet_personal_dictionary_notification(
        student_id,
        _build_quizlet_topic_deleted_message(subgroup_title, "/quizlet/my-dictionary"),
    )
    return {"message": "ok"}


def batch_update_student_personal_quizlet_words(student_id: int) -> dict:
    """Массовое обновление слов с одним уведомлением"""
    _ensure_student_exists(student_id)
    data = validate_req(QuizletPersonalWordBatchReq, request.json)

    changes_count = 0

    # Удалить слова
    for word_id in data.deleted_ids:
        words = DBQS.get_personal_quizlet_words(student_id)
        word = next((item for item in words if item.id == word_id), None)
        if word is not None:
            DBQS.delete_personal_quizlet_word(student_id, word_id)
            changes_count += 1

    # Создать новые слова
    for word_data in data.created:
        DBQS.add_personal_quizlet_word(student_id, word_data)
        changes_count += 1

    # Обновить существующие слова
    for update_data in data.updated:
        word_id = update_data.get("id")
        words = DBQS.get_personal_quizlet_words(student_id)
        word = next((item for item in words if item.id == word_id), None)
        if word is not None:
            update_req = QuizletWordUpdateReq(ru=update_data.get("ru", ""),
                                              word_jp=update_data.get("word_jp", ""),
                                              char_jp=update_data.get("char_jp"),
                                              img=update_data.get("img"))
            DBQS.update_personal_quizlet_word(student_id, word_id, update_req)
            changes_count += 1

    # Отправить одно уведомление за всё
    if changes_count > 0:
        subgroup_title = _get_personal_subgroup_title(student_id, data.subgroup_id)
        _notify_personal_quizlet_batch_updated(student_id, subgroup_title, data.subgroup_id)

    return {"message": "ok", "changes_count": changes_count}


def add_student_personal_quizlet_word(student_id: int) -> dict:
    _ensure_student_exists(student_id)
    data = validate_req(QuizletWordCreateReq, request.json)
    word = DBQS.add_personal_quizlet_word(student_id, data)
    subgroup_title = _get_personal_subgroup_title(student_id, data.subgroup_id)
    _notify_personal_quizlet_updated(student_id, subgroup_title, f"/quizlet/my-dictionary/topics/{data.subgroup_id}")
    return {"word": word}


def update_student_personal_quizlet_word(student_id: int, word_id: int) -> dict:
    _ensure_student_exists(student_id)
    data = validate_req(QuizletWordUpdateReq, request.json)

    words = DBQS.get_personal_quizlet_words(student_id)
    word = next((item for item in words if item.id == word_id), None)
    if word is None:
        raise InvalidAPIUsage("Personal word not found", 404)

    DBQS.update_personal_quizlet_word(student_id, word_id, data)
    subgroup_title = _get_personal_subgroup_title(student_id, word.subgroup_id)
    _notify_personal_quizlet_updated(student_id, subgroup_title, f"/quizlet/my-dictionary/topics/{word.subgroup_id}")
    return {"message": "ok"}


def delete_student_personal_quizlet_word(student_id: int, word_id: int) -> dict:
    _ensure_student_exists(student_id)

    words = DBQS.get_personal_quizlet_words(student_id)
    word = next((item for item in words if item.id == word_id), None)
    if word is None:
        raise InvalidAPIUsage("Personal word not found", 404)

    DBQS.delete_personal_quizlet_word(student_id, word_id)
    subgroup_title = _get_personal_subgroup_title(student_id, word.subgroup_id)
    _notify_personal_quizlet_updated(student_id, subgroup_title, f"/quizlet/my-dictionary/topics/{word.subgroup_id}")
    return {"message": "ok"}


def create_quizlet_assignment() -> dict:
    teacher_id = get_current_user_id()
    data = validate_req(QuizletAssignmentCreateReq, request.json)
    assignment = DBQT.create_quizlet_assignment(teacher_id, data)
    return {"assignment": assignment.__json__()}


def get_quizlet_assignments() -> dict:
    teacher_id = get_current_user_id()
    assignments = DBQT.get_quizlet_assignments_by_creator(teacher_id)
    all_students = DBQT.get_all_students()
    all_students_map = {student.id: student for student in all_students}

    result: list[dict] = []
    for assignment in assignments:
        subgroup_ids = DBQT.get_quizlet_assignment_subgroup_ids(assignment.id)
        subgroups = [subgroup.__json__() for subgroup in DBQT.get_quizlet_subgroups_by_ids(subgroup_ids)]

        targets = DBQT.get_quizlet_assignment_targets(assignment.id)
        results = DBQT.get_quizlet_assignment_results(assignment.id)
        result_by_student_id = {item.student_id: item for item in results}

        target_items: list[dict] = []
        for target in targets:
            student = all_students_map.get(target.student_id)
            target_items.append({
                "id":
                target.id,
                "student":
                None if student is None else student.__json__(),
                "status":
                target.status,
                "assigned_at":
                target.assigned_at,
                "completed_at":
                target.completed_at,
                "result":
                None if result_by_student_id.get(target.student_id) is None else
                result_by_student_id[target.student_id].__json__(),
            })

        completed_count = len([item for item in target_items if item["status"] == "completed"])

        result.append({
            "assignment": assignment.__json__(),
            "subgroups": subgroups,
            "targets": target_items,
            "stats": {
                "total": len(target_items),
                "completed": completed_count,
                "pending": max(0,
                               len(target_items) - completed_count),
            },
        })

    return {"assignments": result}
