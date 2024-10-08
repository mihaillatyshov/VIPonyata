import json
from typing import Generic

from flask import request
from pydantic import ValidationError
from pydantic_core import ErrorDetails

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import (ActivityNotFoundException, InvalidAPIUsage, InvalidRequestJson,
                                             LessonNotFoundException)
from server.models.assessment import (Aliases, AssessmentCreateReq, AssessmentCreateReqStr, BaseModelTask)
from server.models.db_models import (Assessment, AssessmentTry, AssessmentTryType, AssessmentType, FinalBoss,
                                     FinalBossTry)
from server.models.utils import validate_req


def get_assessment_data(assessment_type: type[AssessmentType]) -> DBQT.IAssessmentQueries:
    if assessment_type == Assessment:
        return DBQT.AssessmentQueries
    if assessment_type == FinalBoss:
        return DBQT.FinalBossQueries

    raise InvalidAPIUsage("Check server get_assessment_data()", 500)


def format_model_error(pydantic_errors: list[ErrorDetails]) -> dict:
    error = pydantic_errors[0]
    return {"message": error["msg"], "type": error["type"]}


def parse_task(task: dict) -> BaseModelTask:
    if handler := Aliases.get(task["name"]):
        return handler["create"](**task)

    raise InvalidAPIUsage(f"No parser for task: {task['name']}")


def add_notification(activity_try_id: int, activity_try_type: type[AssessmentTryType]):
    if activity_try_type == FinalBossTry:
        DBQT.add_final_boss_notification(activity_try_id)
    elif activity_try_type == AssessmentTry:
        DBQT.add_assessment_notification(activity_try_id)


class IAssessmentHandlers(Generic[AssessmentType, AssessmentTryType]):
    _activity_queries: DBQT.IAssessmentQueries[AssessmentType, AssessmentTryType]

    def __init__(self, activity_type: type[AssessmentType]):
        self._activity_queries = get_assessment_data(activity_type)

    def get_by_id(self, activity_id: int):
        assessment = self._activity_queries.get_by_id(activity_id)
        return {"assessment": assessment, "tasks": json.loads(assessment.tasks)}

    def create(self, lesson_id: int):
        if DBQT.get_lesson_by_id(lesson_id) is None:
            raise LessonNotFoundException(lesson_id)

        assessment_data = self.prepare_processing_data()
        assessment = self._activity_queries.create(lesson_id, assessment_data)

        return {"assessment": assessment}

    def update(self, activity_id: int):
        if self._activity_queries.get_by_id(activity_id) is None:
            raise ActivityNotFoundException("Assessment")

        self._activity_queries.update(activity_id, self.prepare_processing_data())

        return {"assessment": self._activity_queries.get_by_id(activity_id)}

    def prepare_processing_data(self) -> AssessmentCreateReqStr:
        assessment_req_data = validate_req(AssessmentCreateReq, request.json, 422)

        tasks: list[str] = []
        errors: dict[int, dict] = {}

        for i, task in enumerate(assessment_req_data.tasks):
            try:
                tasks.append(json.dumps(parse_task(task.model_dump()).model_dump()))
            except ValidationError as ex:
                errors[i] = format_model_error(ex.errors())
            except Exception as ex:
                print("ex", ex)

        if len(errors.keys()) != 0:
            raise InvalidAPIUsage("Не все поля заполнены", 422, {"errors": errors})

        return AssessmentCreateReqStr(time_limit=assessment_req_data.time_limit,
                                      description=assessment_req_data.description,
                                      tasks=f"[{','.join(tasks)}]")

    def delete_by_id(self, activity_id: int):
        self._activity_queries.delete_notifications_by_activity_id(activity_id)
        self._activity_queries.delete_tries_by_activity_id(activity_id)
        self._activity_queries.delete_by_id(activity_id)

        return {"message": "ok"}

    def get_done_tries(self, assessment_id: int):
        return {}

    def get_done_try(self, done_try_id: int):
        done_try = self._activity_queries.get_done_try_by_id(done_try_id)

        if done_try is None:
            raise InvalidAPIUsage("Done try not found", 404)

        activity = self._activity_queries.get_by_id(done_try.base_id)

        return {"done_try": done_try, "lesson_id": activity.lesson_id}

    def set_done_try_check(self, done_try_id: int):
        if not request.json:
            raise InvalidRequestJson()
        checks_json = request.json.get("checks")
        if not checks_json:
            raise InvalidAPIUsage("No checks!")

        # TODO: validate checks_json

        done_try = self._activity_queries.get_done_try_by_id(done_try_id)

        if done_try is None:
            raise InvalidAPIUsage("Done try not found", 404)

        db_checks = json.loads(done_try.checked_tasks)

        if len(db_checks) != len(checks_json):
            raise InvalidAPIUsage("Invalid checks count")

        self._activity_queries.set_done_try_checks(done_try_id, json.dumps(checks_json))

        if self.is_try_checked(done_try_id):
            add_notification(done_try_id, self._activity_queries.assessment_try_type)

        return {"message": "Checks successfully set"}

    def is_try_checked(self, done_try_id: int) -> bool:
        done_try = self._activity_queries.get_done_try_by_id(done_try_id)

        if done_try is None:
            raise InvalidAPIUsage("Done try not found", 404)

        db_checks = json.loads(done_try.checked_tasks or "[]")

        return all(check_task.get("cheked", False) for check_task in db_checks)


AssessmentHandlers = IAssessmentHandlers[Assessment, AssessmentTry](Assessment)
FinalBossHandlers = IAssessmentHandlers[FinalBoss, FinalBossTry](FinalBoss)
