from __future__ import annotations

from flask import request

import server.queries.StudentDBqueries as DBQS
from server.handlers.common.assessment_task_flow import parse_student_tasks
from server.models.tasks import HomeworkAssignmentSaveReq
from server.models.utils import validate_req
from server.routes.routes_utils import get_current_user_id


def get_my_homework_assignments() -> dict:
    user_id = get_current_user_id()
    assignments = DBQS.get_homework_assignments_for_student(user_id)
    return {"assignments": assignments}


def start_homework_assignment(assignment_id: int) -> dict:
    user_id = get_current_user_id()
    homework_try = DBQS.start_homework_assignment(user_id, assignment_id)
    assignment = DBQS.get_homework_assignment_by_id_for_student(assignment_id, user_id)
    return {
        "assignment": None if assignment is None else assignment.__json__(),
        "try": homework_try.__json__(),
        "items": parse_student_tasks(homework_try.done_tasks),
    }


def get_homework_try(homework_try_id: int) -> dict:
    user_id = get_current_user_id()
    homework_try = DBQS.get_homework_try(homework_try_id, user_id)
    assignment = DBQS.get_homework_assignment_by_id_for_student(homework_try.assignment_id, user_id)
    return {
        "assignment": None if assignment is None else assignment.__json__(),
        "try": homework_try.__json__(),
        "items": parse_student_tasks(homework_try.done_tasks),
    }


def save_homework_assignment(assignment_id: int) -> dict:
    user_id = get_current_user_id()
    data = validate_req(HomeworkAssignmentSaveReq, request.json)
    homework_try = DBQS.save_homework_assignment_progress(user_id, assignment_id, data.done_tasks)
    return {"try": homework_try.__json__()}


def end_homework_assignment(assignment_id: int) -> dict:
    user_id = get_current_user_id()
    data = validate_req(HomeworkAssignmentSaveReq, request.json)
    homework_try = DBQS.end_homework_assignment(user_id, assignment_id, data.done_tasks)
    return {"try": homework_try.__json__()}
