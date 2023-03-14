import abc
import random
import json

from flask import request
from ...ApiExceptions import InvalidAPIUsage, InvalidRequestJson

from .student_activity_funcs import ActivityFuncs
from ...queries import StudentDBqueries as DBQS
from ..routes_utils import (ActivityEndTimeHandler, GetCurrentUserId, StartActivityTimerLimit)
from ...queries.DBqueriesUtils import DBsession
from ...db_models import Assessment
from ...log_lib import LogI, LogW, LogE


class AssessmentTaskName:
    TEXT = "text"
    TEST_SINGLE = "test_single"
    TEST_MULTI = "test_multi"
    CREATE_SENTENCE = "create_sentence"
    FILL_SPACES_EXISTS = "fill_spaces_exists"
    FILL_SPACES_BY_HAND = "fill_spaces_by_hand"
    FIND_PAIR = "find_pair"
    CLASSIFICATION = "classification"
    SENTENCE_OREDER = "sentence_order"
    OPEN_QUESTION = "open_question"
    IMG = "img"


AssessmentTaskNameList = [
    value for name, value in vars(AssessmentTaskName).items()
    if not callable(getattr(AssessmentTaskName, name)) and not name.startswith("__")
]


class AssessmentParser(abc.ABC):
    def CanParse(self, task_json: dict) -> bool:
        return self.name() == task_json["name"]

    @abc.abstractmethod
    def name(self) -> str:
        pass

    @abc.abstractmethod
    def parse(self, task_json: dict) -> dict:
        pass


class Handlers:
    handlers = {}
    stop_adding = False

    def Add(self):
        LogI("Start add_parser: ")

        def decorator(parser):
            if not self.stop_adding:
                parser_obj = parser()
                self.handlers[parser_obj.name()] = parser_obj                                                           # TODO add check of adding existing parser
                LogI("Added parser: ", parser)
            return parser

        return decorator

    def StopAdding(self):
        self.stop_adding = True

    def __call__(self):
        return self.handlers


handlers = Handlers()


@handlers.Add()
class TextParser(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.TEXT

    def parse(self, task_json: dict) -> dict:
        return task_json


@handlers.Add()
class SingleTestParser(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.TEST_SINGLE

    def parse(self, task_json: dict) -> dict:
        task_json["answer"] = None
        return task_json


@handlers.Add()
class MultiTestParser(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.TEST_MULTI

    def parse(self, task_json: dict) -> dict:
        task_json["answers"] = []
        return task_json


@handlers.Add()
class FindPairParser(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.FIND_PAIR

    def parse(self, task_json: dict) -> dict:
        random.shuffle(task_json["first"])
        random.shuffle(task_json["second"])
        return task_json


@handlers.Add()
class CreateSentence(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.CREATE_SENTENCE

    def parse(self, task_json: dict) -> dict:
        random.shuffle(task_json["parts"])
        return task_json


@handlers.Add()
class FillSpacesExists(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.FILL_SPACES_EXISTS

    def parse(self, task_json: dict) -> dict:
        random.shuffle(task_json["answers"])
        task_json["inputs"] = task_json["answers"].copy()
        for i in range(len(task_json["answers"])):
            task_json["answers"][i] = None
        return task_json


@handlers.Add()
class FillSpacesByHand(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.FILL_SPACES_BY_HAND

    def parse(self, task_json: dict) -> dict:
        for i in range(len(task_json["answers"])):
            task_json["answers"][i] = ""
        return task_json


@handlers.Add()
class ClassificationParser(AssessmentParser):
    def name(self) -> str:
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


@handlers.Add()
class SentenceOrderParser(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.SENTENCE_OREDER

    def parse(self, task_json: dict) -> dict:
        random.shuffle(task_json["sentences"])
        return task_json


@handlers.Add()
class OpenQuestionParser(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.OPEN_QUESTION

    def parse(self, task_json: dict) -> dict:
        task_json["answer"] = ""
        return task_json


@handlers.Add()
class ImgParser(AssessmentParser):
    def name(self) -> str:
        return AssessmentTaskName.IMG

    def parse(self, task_json: dict) -> dict:
        return task_json


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