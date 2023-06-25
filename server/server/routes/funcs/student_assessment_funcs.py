import abc
import json
import random
from types import NoneType
from typing import Any

from flask import request

from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.queries import StudentDBqueries as DBQS
from server.queries.DBqueriesUtils import DBsession
from server.models.assessment import AssessmentTaskName

from ...db_models import Assessment
from ...log_lib import LogE, LogI, LogW
from ..routes_utils import (ActivityEndTimeHandler, GetCurrentUserId, StartActivityTimerLimit)
from .student_activity_funcs import ActivityFuncs


class AssessmentParser(abc.ABC):
    def CanParse(self, task_json: dict) -> bool:
        return self.name() == task_json["name"]

    @abc.abstractmethod
    def name(self) -> AssessmentTaskName:
        pass

    @abc.abstractmethod
    def parse(self, task_json: dict) -> dict:
        pass

    @abc.abstractmethod
    def checkInputFields(self, origin: dict, input: dict) -> bool:
        pass

    def checkInput(self, origin: dict, input: dict) -> bool:
        return self.CanParse(input) and self.checkInputFields(origin, input)


class Handlers:
    _handlers: dict[str, Any] = {}
    stop_adding = False

    def Add(self):
        LogI("Start add_parser: ")

        def decorator(parser):
            if not self.stop_adding:
                parser_obj = parser()
                self._handlers[parser_obj.name()] = parser_obj                                                          # TODO add check of adding existing parser
                LogI("Added parser: ", parser)
            return parser

        return decorator

    def StopAdding(self):
        self.stop_adding = True

    def __call__(self):
        return self._handlers


handlers = Handlers()


@handlers.Add()
class TextParser(AssessmentParser):
    def name(self) -> AssessmentTaskName:
        return AssessmentTaskName.TEXT

    def parse(self, task_json: dict) -> dict:
        return task_json

    def checkInputFields(self, origin: dict, input: dict) -> bool:
        return True


@handlers.Add()
class SingleTestParser(AssessmentParser):
    def name(self) -> AssessmentTaskName:
        return AssessmentTaskName.TEST_SINGLE

    def parse(self, task_json: dict) -> dict:
        task_json["answer"] = None
        return task_json

    def checkInputFields(self, origin: dict, input: dict) -> bool:                                                      # TODO make it better !!!
        answer = input.get("answer", -1)
        if answer == -1:
            return False

        if not (type(answer) is NoneType or type(answer) is int):
            return False

        if (type(answer) is int):
            if answer < 0 or answer >= len(origin["options"]):
                return False

        return True


@handlers.Add()
class MultiTestParser(AssessmentParser):
    def name(self) -> AssessmentTaskName:
        return AssessmentTaskName.TEST_MULTI

    def parse(self, task_json: dict) -> dict:
        task_json["answers"] = []
        return task_json

    def checkInputFields(self, origin: dict, input: dict) -> bool:                                                      # TODO
        return False


@handlers.Add()
class FindPairParser(AssessmentParser):
    def name(self) -> AssessmentTaskName:
        return AssessmentTaskName.FIND_PAIR

    def parse(self, task_json: dict) -> dict:
        random.shuffle(task_json["first"])
        random.shuffle(task_json["second"])
        task_json["pars_created"] = 0
        return task_json

    def checkInputFields(self, origin: dict, input: dict) -> bool:                                                      # TODO
        return False


@handlers.Add()
class CreateSentence(AssessmentParser):
    def name(self) -> AssessmentTaskName:
        return AssessmentTaskName.CREATE_SENTENCE

    def parse(self, task_json: dict) -> dict:
        random.shuffle(task_json["parts"])
        return task_json

    def checkInputFields(self, origin: dict, input: dict) -> bool:                                                      # TODO
        return False


@handlers.Add()
class FillSpacesExists(AssessmentParser):
    def name(self) -> AssessmentTaskName:
        return AssessmentTaskName.FILL_SPACES_EXISTS

    def parse(self, task_json: dict) -> dict:
        random.shuffle(task_json["answers"])
        task_json["inputs"] = task_json["answers"].copy()
        for i in range(len(task_json["answers"])):
            task_json["answers"][i] = None
        return task_json

    def checkInputFields(self, origin: dict, input: dict) -> bool:                                                      # TODO
        return False


@handlers.Add()
class FillSpacesByHand(AssessmentParser):
    def name(self) -> AssessmentTaskName:
        return AssessmentTaskName.FILL_SPACES_BY_HAND

    def parse(self, task_json: dict) -> dict:
        for i in range(len(task_json["answers"])):
            task_json["answers"][i] = ""
        return task_json

    def checkInputFields(self, origin: dict, input: dict) -> bool:                                                      # TODO
        return False


@handlers.Add()
class ClassificationParser(AssessmentParser):
    def name(self) -> AssessmentTaskName:
        return AssessmentTaskName.CLASSIFICATION

    def parse(self, task_json: dict) -> dict:
        task_json["titles"] = []
        task_json["inputs"] = []
        task_json["answers"] = []
        for column in task_json["columns"]:
            task_json["titles"].append(column["title"])
            task_json["inputs"].extend(column["data"])
            task_json["answers"].append([])
        del task_json["columns"]
        return task_json

    def checkInputFields(self, origin: dict, input: dict) -> bool:                                                      # TODO
        return False


@handlers.Add()
class SentenceOrderParser(AssessmentParser):
    def name(self) -> AssessmentTaskName:
        return AssessmentTaskName.SENTENCE_OREDER

    def parse(self, task_json: dict) -> dict:
        random.shuffle(task_json["parts"])
        return task_json

    def checkInputFields(self, origin: dict, input: dict) -> bool:                                                      # TODO
        return False


@handlers.Add()
class OpenQuestionParser(AssessmentParser):
    def name(self) -> AssessmentTaskName:
        return AssessmentTaskName.OPEN_QUESTION

    def parse(self, task_json: dict) -> dict:
        task_json["answer"] = ""
        return task_json

    def checkInputFields(self, origin: dict, input: dict) -> bool:                                                      # TODO
        return False


@handlers.Add()
class ImgParser(AssessmentParser):
    def name(self) -> AssessmentTaskName:
        return AssessmentTaskName.IMG

    def parse(self, task_json: dict) -> dict:
        return task_json

    def checkInputFields(self, origin: dict, input: dict) -> bool:                                                      # TODO
        return False


def ParseTasks(data_str: str) -> list[dict]:
    data = json.loads(data_str)

    tasks = []
    for task in data["tasks"]:
        if handler := handlers().get(task["name"]):
            LogI(handler.name())
            tasks.append(handler.parse(task))
        else:
            LogW("No parser for this task!", task["name"])
    return tasks


# TODO when new task created check that fields in {tests; find parit;} don't repeat
class AssessmentFuncsClass(ActivityFuncs):
    _activityQueries: DBQS.AssessmentQueriesClass

    def __init__(self):
        super().__init__(Assessment)

    def StartNewTry(self, activityId: int):
        activity = self._activityQueries.GetById(activityId, GetCurrentUserId())
        activityTries = self._activityQueries.GetTriesByActivityId(activityId, GetCurrentUserId())

        if activityTries and activityTries[-1].end_datetime == None:
            return {"message": "Lexis try already Exists"}, 409

        tasks = json.dumps(ParseTasks(                                                                                  #
            activity.tasks                                                                                              # type: ignore
        ))                                                                                                              #
        newActivityTry = self._activityQueries.AddNewTry(len(activityTries) + 1, activityId, GetCurrentUserId(), tasks)

        if activity.time_limit and newActivityTry:
            StartActivityTimerLimit(                                                                                    #
                activity.time_limit__ToTimedelta(),                                                                     #
                newActivityTry.id,                                                                                      # type: ignore
                self._activityQueries._activityTry_type)                                                                #
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

        return {                                                                                                        #
            self._activityName: assessment,                                                                             #
            "items": json.loads(assessment.now_try.done_tasks)                                                          # type: ignore
        }


handlers.StopAdding()
AssessmentFuncs = AssessmentFuncsClass()