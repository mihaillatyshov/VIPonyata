from __future__ import annotations

import json

from flask import request

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.handlers.common.assessment_task_flow import parse_student_tasks
from server.handlers.teacher.assessment_handlers import parse_task
from server.models.assessment import AssessmentTaskName
from server.models.tasks import HomeworkAssignmentCreateReq, TaskBankItemCreateReq, TaskBankItemUpdateReq
from server.models.utils import validate_req
from server.routes.routes_utils import get_current_user_id

NON_ANSWER_TASK_NAMES = {
    AssessmentTaskName.TEXT.value,
    AssessmentTaskName.IMG.value,
    AssessmentTaskName.AUDIO.value,
    AssessmentTaskName.BLOCK_BEGIN.value,
    AssessmentTaskName.BLOCK_END.value,
}


def _build_homework_try_summary(homework_try):
    done_tasks = json.loads(homework_try.done_tasks)
    checked_tasks = json.loads(homework_try.checked_tasks)
    mistakes_count = sum(task.get("mistakes_count", 0) for task in checked_tasks)
    correct_answers = 0
    for done_task, checked_task in zip(done_tasks, checked_tasks):
        if done_task.get("name") in NON_ANSWER_TASK_NAMES:
            continue
        if checked_task.get("cheked", False) and checked_task.get("mistakes_count", 0) == 0:
            correct_answers += 1

    return {
        **homework_try.__json__(),
        "mistakes_count": mistakes_count,
        "correct_answers": correct_answers,
    }


def get_tasks_options() -> dict:
    students = DBQT.get_all_students()
    lessons = DBQT.get_all_lessons_for_assignment()
    hidden_lesson_ids = DBQT.get_hidden_task_bank_lesson_ids()
    return {
        "students": [student.__json__() for student in students],
        "lessons": [lesson.__json__() for lesson in lessons],
        "hidden_lesson_ids": hidden_lesson_ids,
    }


def get_task_bank() -> dict:
    student_id_raw = request.args.get("student_id")
    student_id = None if student_id_raw in [None, ""] else int(student_id_raw)

    items = DBQT.get_task_bank_items()
    lessons = DBQT.get_all_lessons_for_assignment()
    hidden_lesson_ids = DBQT.get_hidden_task_bank_lesson_ids()
    completion_counts = DBQT.get_task_bank_completion_counts(
        student_id, [item.id for item in items]) if student_id is not None else {}

    return {
        "lessons": [lesson.__json__() for lesson in lessons],
        "hidden_lesson_ids": hidden_lesson_ids,
        "items": [{
            **item.__json__(),
            "completion_count": completion_counts.get(item.id, 0),
        } for item in items],
    }


def hide_task_bank_lesson(lesson_id: int) -> dict:
    DBQT.hide_task_bank_lesson(lesson_id)
    return {"message": "ok"}


def show_task_bank_lesson(lesson_id: int) -> dict:
    DBQT.show_task_bank_lesson(lesson_id)
    return {"message": "ok"}


def create_task_bank_item() -> dict:
    data = validate_req(TaskBankItemCreateReq, request.json)
    parse_task(data.task.model_dump())
    item = DBQT.create_task_bank_item(data)
    return {"item": item.__json__()}


def update_task_bank_item(item_id: int) -> dict:
    data = validate_req(TaskBankItemUpdateReq, request.json)
    parse_task(data.task.model_dump())
    item = DBQT.update_task_bank_item(item_id, data)
    return {"item": item.__json__()}


def delete_task_bank_item(item_id: int) -> dict:
    DBQT.delete_task_bank_item(item_id)
    return {"message": "ok"}


def create_homework_assignment() -> dict:
    teacher_id = get_current_user_id()
    data = validate_req(HomeworkAssignmentCreateReq, request.json)
    for task in data.tasks:
        parse_task(task.task.model_dump())
    assignment = DBQT.create_homework_assignment(teacher_id, data)
    return {"assignment": assignment.__json__()}


def cancel_homework_assignment_target(target_id: int) -> dict:
    teacher_id = get_current_user_id()
    DBQT.cancel_homework_assignment_target(teacher_id, target_id)
    return {"message": "ok"}


def get_homework_assignments() -> dict:
    teacher_id = get_current_user_id()
    assignments = DBQT.get_homework_assignments_by_creator(teacher_id)
    all_students = DBQT.get_all_students()
    students_by_id = {student.id: student for student in all_students}

    result: list[dict] = []
    for assignment in assignments:
        tasks = DBQT.get_homework_assignment_tasks(assignment.id)
        targets = DBQT.get_homework_assignment_targets(assignment.id)
        tries = DBQT.get_homework_tries_by_assignment(assignment.id)
        tries_by_target_id = {item.target_id: item for item in tries}

        target_items = []
        for target in targets:
            homework_try = tries_by_target_id.get(target.id)
            target_items.append({
                "id":
                target.id,
                "student":
                None if students_by_id.get(target.student_id) is None else students_by_id[target.student_id].__json__(),
                "status":
                target.status,
                "assigned_at":
                target.assigned_at,
                "completed_at":
                target.completed_at,
                "result":
                None if homework_try is None or homework_try.end_datetime is None else
                _build_homework_try_summary(homework_try),
            })

        completed_count = len([item for item in target_items if item["status"] == "completed"])
        cancelled_count = len([item for item in target_items if item["status"] == "cancelled"])
        result.append({
            "assignment": assignment.__json__(),
            "tasks": [task.__json__() for task in tasks],
            "targets": target_items,
            "stats": {
                "total": len(target_items),
                "completed": completed_count,
                "pending": max(0,
                               len(target_items) - completed_count - cancelled_count),
                "cancelled": cancelled_count,
            },
        })

    return {"assignments": result}


def get_homework_try_result(homework_try_id: int) -> dict:
    homework_try = DBQT.get_homework_try_by_id(homework_try_id)
    if homework_try is None:
        raise InvalidAPIUsage("Homework try not found", 404)

    assignment = DBQT.get_homework_assignment_by_id(homework_try.assignment_id)
    if assignment is None:
        raise InvalidAPIUsage("Homework assignment not found", 404)

    return {
        "assignment": assignment.__json__(),
        "try": _build_homework_try_summary(homework_try),
        "items": parse_student_tasks(homework_try.done_tasks),
    }
