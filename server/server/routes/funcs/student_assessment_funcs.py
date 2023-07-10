import abc
import json
import random
from types import NoneType
from typing import Any

from flask import request

from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.models.assessment import AssessmentTaskName, Aliases
from server.queries import StudentDBqueries as DBQS
from server.queries.DBqueriesUtils import DBsession

from server.db_models import Assessment, time_limit_to_timedelta
from server.log_lib import LogE, LogI, LogW
from ..routes_utils import (ActivityEndTimeHandler, GetCurrentUserId, StartActivityTimerLimit)
from .student_activity_funcs import ActivityFuncs


def parse_new_tasks(data_str: str) -> list[dict]:
    data = json.loads(data_str)

    tasks = []
    for task in data:
        if handler := Aliases.get(task["name"]):
            LogI(task["name"])
            LogI(task)
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
            LogI(task["name"])
            LogI(task)
            task_db = handler["res"](**task)
            tasks.append(task_db.student_dict())
        else:
            LogW("No parser for this task!", task["name"])
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

    def AddNewDoneTask(self, activityId: int):
        if not request.json:
            raise InvalidRequestJson()

        taskId = request.json.get("id")
        data = request.json.get("data")
        if not taskId or not data or type(taskId) != int:
            raise InvalidRequestJson()

        activityTry = self._activityQueries.GetUnfinishedTryByActivityId(activityId, GetCurrentUserId())
        done_tasks = json.loads(activityTry.done_tasks)                                                                 # type: ignore
        if taskId < 0 or taskId >= len(done_tasks):
            raise InvalidRequestJson()

        task: dict = done_tasks[taskId]
        if handler := handlers().get(task["name"]):
            # TODO in check do checks: all fields exists; no extra fields; fields have needed data
            if not handler.check(task, data):
                raise InvalidRequestJson()
        else:
            raise InvalidRequestJson()

        done_tasks[taskId] = data
        activityTry.done_tasks = json.dumps(done_tasks)                                                                 # type: ignore
        DBsession().add(activityTry)
        DBsession().commit()

    def EndTry(self, activityId: int):
        if not request.json:
            raise InvalidRequestJson()
        done_tasks = request.json.get("done_tasks")
        LogI("Done Tasks: ", done_tasks)
        if not done_tasks:
            raise InvalidAPIUsage("No done tasks!")

        # TODO Add some checks(all tasks in request exists)

        activityTry = self._activityQueries.GetUnfinishedTryByActivityId(activityId, GetCurrentUserId())
        # TODO Add it back
        # activityTry.done_tasks = done_tasks

        DBsession().add(activityTry)
        DBsession().commit()

        ActivityEndTimeHandler(                                                                                         #
            activityTry.id,                                                                                             # type: ignore
            self._activityQueries._activityTry_type)                                                                    #
        return {"message": "Successfully closed"}

    def GetById(self, activityId: int):
        assessment = self._activityQueries.GetById(activityId, GetCurrentUserId())
        assessment.now_try = self._activityQueries.GetUnfinishedTryByActivityId(activityId, GetCurrentUserId())
        tasks = parse_student_tasks(assessment.now_try.done_tasks)
        return {self._activityName: assessment, "items": tasks}


AssessmentFuncs = AssessmentFuncsClass()