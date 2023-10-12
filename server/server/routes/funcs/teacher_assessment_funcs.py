import json

from flask import request
from pydantic import ValidationError

import server.queries.TeacherDBqueries as DBQT
from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.models.assessment import (Aliases, AssessmentCreateReq, AssessmentTaskName, BaseModelTask)
from server.models.db_models import Assessment


def parse_task(task: dict) -> BaseModelTask:
    if handler := Aliases.get(task["name"]):
        return handler["create"](**task)

    raise InvalidAPIUsage(f"No parser for task: {task['name']}")


class IAssessmentFuncs:
    def GetById(self, assessmentId: int):
        return {}

    def create(self, lesson_id: int):
        if not request.json:
            raise InvalidRequestJson()

        lesson = DBQT.get_lesson_by_id(lesson_id)
        if lesson is None:
            raise InvalidAPIUsage("No lesson in db!", 404)

        req_tasks = request.json.get("tasks")
        if req_tasks is None or not isinstance(req_tasks, list):
            raise InvalidRequestJson()

        tasks: list[str] = []
        errors: dict[int, list] = {}

        for i, task in enumerate(req_tasks):
            try:
                tasks.append(json.dumps(parse_task(task).model_dump()))
            except ValidationError as ex:
                print(ex.errors())
                errors[i] = ex.errors()

        if len(errors.keys()) != 0:
            return {"errors": errors}, 422

        assessment_data = AssessmentCreateReq(time_limit=request.json.get("time_limit"),
                                              description=request.json.get("description"),
                                              tasks=f"[{','.join(tasks)}]")

        assessment = DBQT.AssesmentQueries.create(lesson_id, assessment_data)

        return {"assessment": assessment}


AssessmentFuncs = IAssessmentFuncs()
