import json

from flask import request

from server.common import DBsession
from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.log_lib import LogE, LogW
from server.models.assessment import Aliases, AssessmentTaskName
from server.models.db_models import Assessment, time_limit_to_timedelta
from server.queries import StudentDBqueries as DBQS

from ..routes_utils import (ActivityEndTimeHandler, GetCurrentUserId, StartActivityTimerLimit)
from .student_activity_funcs import ActivityFuncs


def parse_new_tasks(data_str: str) -> list[dict]:
    data = json.loads(data_str)

    tasks = []
    for task in data:
        if handler := Aliases.get(task["name"]):
            task_base = handler["create"](**task)
            task_new = handler["res"](**task_base.dict())
            tasks.append(task_new.dict())
        else:
            LogW("No parser for this task!", task["name"])
    return tasks


def parse_student_tasks(data_str: str) -> list[dict]:
    data = json.loads(data_str)

    tasks = []
    for task in data:
        if handler := Aliases.get(task["name"]):
            task_db = handler["res"](**task)
            if (task["name"] == AssessmentTaskName.CLASSIFICATION):
                print("parse_student_tasks:   ", task_db)
                print("parse_student_tasks 2:    ", task_db.student_dict())
            tasks.append(task_db.student_dict())
        else:
            LogW("No parser for this task!", task["name"])
    return tasks


def parse_student_req(req_data: dict, db_data: dict) -> str:
    tasks: list = []

    if not isinstance(req_data, list) or len(req_data) != len(db_data):
        raise InvalidRequestJson()

    for req, db in zip(req_data, db_data):
        if req.get("name") is None:
            raise InvalidRequestJson()

        if handler := Aliases.get(req["name"]):
            req_handler = handler["req"](**req)
            db_handler = handler["res"](**db)
            res_handler = handler["res"](**(db_handler.combine_dict() | req_handler.combine_dict()))
            if not res_handler.custom_validation():
                LogE(req, "\n", db)
                LogW(req_handler)
                LogW(db_handler)
                LogW(res_handler)

                raise InvalidAPIUsage(f"Currupted task {req['name']}")
            tasks.append(res_handler.dict())
        else:
            raise InvalidAPIUsage(f"Wrong name alias {req['name']}")

    return tasks


class AssessmentFuncsClass(ActivityFuncs):
    _activityQueries: DBQS.AssessmentQueriesClass

    def __init__(self):
        super().__init__(Assessment)

    def StartNewTry(self, activityId: int):
        activity = self._activityQueries.GetById(activityId, GetCurrentUserId())
        activity_tries = self._activityQueries.GetTriesByActivityId(activityId, GetCurrentUserId())

        if activity_tries and activity_tries[-1].end_datetime == None:
            return {"message": "Lexis try already Exists"}, 409

        tasks = json.dumps(parse_new_tasks(activity.tasks))
        new_activity_try = self._activityQueries.AddNewTry(
            len(activity_tries) + 1, activityId, GetCurrentUserId(), tasks)

        if activity.time_limit and new_activity_try:
            StartActivityTimerLimit(time_limit_to_timedelta(activity.time_limit), new_activity_try.id,
                                    self._activityQueries._activityTry_type)
        return {"message": "Lexis try successfully created"}

    def _SetDoneTasks(self, req_data, activity_id: int):
        done_tasks = req_data.get("done_tasks")
        if not done_tasks:
            raise InvalidAPIUsage("No done tasks!")

        activity_try = self._activityQueries.GetUnfinishedTryByActivityId(activity_id, GetCurrentUserId())

        db_done_tasks = json.loads(activity_try.done_tasks)

        # Check DoneTasks
        done_tasks_str = json.dumps(parse_student_req(done_tasks, db_done_tasks))
        activity_try.done_tasks = done_tasks_str

        # Set DoneTasks
        DBsession().add(activity_try)
        DBsession().commit()

        return activity_try

    def AddNewDoneTasks(self, activityId: int):
        if not request.json:
            raise InvalidRequestJson()

        self._SetDoneTasks(request.json, activityId)

        return {"message": "ok"}

    def EndTry(self, activityId: int):
        if not request.json:
            raise InvalidRequestJson()

        activity_try = self._SetDoneTasks(request.json, activityId)

        ActivityEndTimeHandler(activity_try.id, self._activityQueries._activityTry_type)
        return {"message": "Successfully closed"}

    def GetById(self, activityId: int):
        assessment = self._activityQueries.GetById(activityId, GetCurrentUserId())
        assessment.now_try = self._activityQueries.GetUnfinishedTryByActivityId(activityId, GetCurrentUserId())
        print(assessment.now_try.done_tasks)
        tasks = parse_student_tasks(assessment.now_try.done_tasks)
        print("after parse:   ", tasks)
        return {self._activityName: assessment, "items": tasks}


AssessmentFuncs = AssessmentFuncsClass()