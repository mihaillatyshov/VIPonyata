import json

from flask import request
from pydantic import ValidationError
from pydantic_core import ErrorDetails
from server.models.utils import validate_req

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.models.assessment import (Aliases, AssessmentCreateReq, AssessmentCreateReqStr,
                                      BaseModelTask)


def format_model_error(pydantic_errors: list[ErrorDetails]) -> dict:
    error = pydantic_errors[0]
    return {"message": error["msg"], "type": error["type"]}


def parse_task(task: dict) -> BaseModelTask:
    if handler := Aliases.get(task["name"]):
        return handler["create"](**task)

    raise InvalidAPIUsage(f"No parser for task: {task['name']}")


class IAssessmentFuncs:
    def GetById(self, assessmentId: int):
        return {}

    def create(self, lesson_id: int):
        assessment_req_data = validate_req(AssessmentCreateReq, request.json, 422)

        lesson = DBQT.get_lesson_by_id(lesson_id)
        if lesson is None:
            raise InvalidAPIUsage("No lesson in db!", 404)

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

        assessment = DBQT.AssessmentQueries.create(lesson_id, assessment_data)

        return {"assessment": assessment}


AssessmentFuncs = IAssessmentFuncs()
