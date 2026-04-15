from flask import request

import server.queries.TeacherDBqueries as DBQT
from server.models.quizlet import (QuizletGroupCreateReq, QuizletSubgroupCreateReq, QuizletWordCreateReq,
                                   QuizletAssignmentCreateReq, QuizletWordsBatchCreateReq, QuizletWordUpdateReq)
from server.models.utils import validate_req
from server.routes.routes_utils import get_current_user_id


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
                "id": target.id,
                "student": None if student is None else student.__json__(),
                "status": target.status,
                "assigned_at": target.assigned_at,
                "completed_at": target.completed_at,
                "result": None
                if result_by_student_id.get(target.student_id) is None else result_by_student_id[target.student_id].__json__(),
            })

        completed_count = len([item for item in target_items if item["status"] == "completed"])

        result.append({
            "assignment": assignment.__json__(),
            "subgroups": subgroups,
            "targets": target_items,
            "stats": {
                "total": len(target_items),
                "completed": completed_count,
                "pending": max(0, len(target_items) - completed_count),
            },
        })

    return {"assignments": result}
