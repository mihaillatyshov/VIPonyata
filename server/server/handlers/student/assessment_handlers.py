import json

from flask import request

from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.handlers.common.assessment_auto_checks import CheckAliases
from server.handlers.student.activity_handlers import ActivityHandlers
from server.log_lib import LogE, LogW
from server.models.assessment import Aliases
from server.models.db_models import (AbstractAssessmentTry, Assessment, AssessmentTry,
                                     AssessmentTryType, AssessmentType,
                                     FinalBoss, FinalBossTry,
                                     time_limit_to_timedelta)
from server.queries import StudentDBqueries as DBQS
from server.routes.routes_utils import (activity_end_time_handler,
                                        get_current_user_id,
                                        start_activity_timer_limit)


def parse_new_tasks(data_str: str) -> list[dict]:
    data = json.loads(data_str)

    tasks = []
    for task in data:
        if handler := Aliases.get(task["name"]):
            task_base = handler["create"](**task)
            task_new = handler["res"](**task_base.model_dump())
            tasks.append(task_new.model_dump())
        else:
            LogW("No parser for this task!", task["name"])
    return tasks


def parse_student_tasks(data_str: str) -> list[dict]:
    data = json.loads(data_str)

    tasks = []
    for task in data:
        if handler := Aliases.get(task["name"]):
            task_db = handler["res"](**task)
            tasks.append(task_db.student_dict())
        else:
            LogW("No parser for this task!", task["name"])
    return tasks


def parse_student_req(req_data: dict, db_data: dict) -> list[dict]:
    tasks: list[dict] = []

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
            tasks.append(res_handler.model_dump())
        else:
            raise InvalidAPIUsage(f"Wrong name alias {req['name']}")

    return tasks


def check_task_req(tasks: list[dict]) -> list[dict]:
    checks: list[dict] = []
    for task in tasks:
        handler = Aliases.get(task["name"])
        check_handler = CheckAliases.get(task["name"])
        if handler is None or check_handler is None:
            raise InvalidAPIUsage(f"Currupted task {task['name']}")

        res_task = handler["res"](**task)
        checks.append(check_handler(res_task).model_dump())

    return checks


def calc_mistakes_count(activity_try: AbstractAssessmentTry) -> int:
    checked_tasks = json.loads(activity_try.checked_tasks or "[]")
    return sum(check_task.get("mistakes_count", 0) for check_task in checked_tasks)


def calc_is_checked(activity_try: AbstractAssessmentTry) -> bool:
    checked_tasks = json.loads(activity_try.checked_tasks or "[]")
    return all(check_task.get("cheked", False) for check_task in checked_tasks)


class IAssessmentHandlers(ActivityHandlers[AssessmentType, AssessmentTryType]):
    _activity_queries: DBQS.AssessmentQueriesClass[AssessmentType, AssessmentTryType]

    def start_new_try(self, activity_id: int):
        activity = self._activity_queries.get_by_id(activity_id, get_current_user_id())
        activity_tries = self._activity_queries.get_tries_by_activity_id(activity_id, get_current_user_id())

        if activity_tries and activity_tries[-1].end_datetime == None:
            return {"message": "Lexis try already Exists"}, 409

        new_tasks = parse_new_tasks(activity.tasks)
        checked_tasks = check_task_req(new_tasks)
        new_activity_try = self._activity_queries.add_assessment_new_try(
            len(activity_tries) + 1, activity_id, get_current_user_id(), json.dumps(new_tasks),
            json.dumps(checked_tasks))

        if activity.time_limit and new_activity_try:
            start_activity_timer_limit(time_limit_to_timedelta(activity.time_limit), new_activity_try.id,
                                       self._activity_queries._activityTry_type)
        return {"message": "Lexis try successfully created"}

    def _set_done_tasks(self, req_data: dict, activity_id: int):
        done_tasks_json = req_data.get("done_tasks")
        if not done_tasks_json:
            raise InvalidAPIUsage("No done tasks!")

        activity_try = self._activity_queries.get_unfinished_try_by_activity_id(activity_id, get_current_user_id())

        db_done_tasks = json.loads(activity_try.done_tasks)

        done_tasks_list = parse_student_req(done_tasks_json, db_done_tasks)
        checked_tasks_list = check_task_req(done_tasks_list)

        self._activity_queries.add_done_and_check_tasks(activity_try.id,
                                                        json.dumps(done_tasks_list),
                                                        json.dumps(checked_tasks_list))

        return activity_try

    def add_new_done_tasks(self, activity_id: int):
        if not request.json:
            raise InvalidRequestJson()

        self._set_done_tasks(request.json, activity_id)

        return {"message": "ok"}

    def end_try(self, activity_id: int):
        if not request.json:
            raise InvalidRequestJson()

        activity_try = self._set_done_tasks(request.json, activity_id)

        activity_end_time_handler(activity_try.id, self._activity_queries._activityTry_type)
        return {"message": "Successfully closed"}

    def get_by_id(self, activity_id: int):
        assessment = self._activity_queries.get_by_id(activity_id, get_current_user_id())
        assessment.now_try = self._activity_queries.get_unfinished_try_by_activity_id(
            activity_id, get_current_user_id())
        tasks = parse_student_tasks(assessment.now_try.done_tasks)
        return {"assessment": assessment, "items": tasks}

    def get_done_tasks(self, activity_id: int):
        self._activity_queries.get_by_id(activity_id, get_current_user_id())

        done_tries = self._activity_queries.get_done_tries_by_activity_id(activity_id, get_current_user_id())

        result = []
        for done_try in done_tries:
            result.append(
                {**done_try.__json__(),
                 "mistakes_count": calc_mistakes_count(done_try),
                 "is_checked": calc_is_checked(done_try)})
            done_try.done_tasks = parse_student_tasks(done_try.done_tasks)
        return {"done_tries": result}


AssessmentHandlers = IAssessmentHandlers[Assessment, AssessmentTry](Assessment)
FinalBossHandlers = IAssessmentHandlers[FinalBoss, FinalBossTry](FinalBoss)
