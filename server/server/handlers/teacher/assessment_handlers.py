import json
from typing import Generic

from flask import request
from pydantic import ValidationError
from pydantic_core import ErrorDetails
from server.models.db_models import Assessment, AssessmentTry, AssessmentTryType, AssessmentType, FinalBoss, FinalBossTry
from server.models.utils import validate_req

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidAPIUsage, LessonNotFoundException
from server.models.assessment import (Aliases, AssessmentCreateReq, AssessmentCreateReqStr,
                                      BaseModelTask)


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


class IAssessmentHandlers(Generic[AssessmentType, AssessmentTryType]):
    _activity_queries: DBQT.IAssessmentQueries[AssessmentType, AssessmentTryType]

    def __init__(self, activity_type: type[AssessmentType]):
        self._activity_queries = get_assessment_data(activity_type)

    def get_by_id(self, assessment_id: int):
        return {}

    def create(self, lesson_id: int):
        assessment_req_data = validate_req(AssessmentCreateReq, request.json, 422)

        lesson = DBQT.get_lesson_by_id(lesson_id)
        if lesson is None:
            raise LessonNotFoundException(lesson_id)

        tasks: list[str] = []
        errors: dict[int, dict] = {}

        for i, task in enumerate(assessment_req_data.tasks):
            try:
                tasks.append(json.dumps(parse_task(task.model_dump()).model_dump()))
            except ValidationError as ex:
                print("ex.errors():", ex.errors())
                errors[i] = format_model_error(ex.errors())
            except Exception as ex:
                print("ex:", ex)

        if len(errors.keys()) != 0:
            print("errors:", errors)
            return {"errors": errors}, 422

        assessment_data = AssessmentCreateReqStr(time_limit=assessment_req_data.time_limit,
                                                 description=assessment_req_data.description,
                                                 tasks=f"[{','.join(tasks)}]")

        assessment = self._activity_queries.create(lesson_id, assessment_data)

        return {"assessment": assessment}

    def get_done_tries(self, assessment_id: int):
        return {}

    def get_done_try(self, done_try_id: int):
        return {}


AssessmentHandlers = IAssessmentHandlers[Assessment, AssessmentTry](Assessment)
FinalBossHandlers = IAssessmentHandlers[FinalBoss, FinalBossTry](FinalBoss)
