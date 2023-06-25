from flask import request
from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from ..routes_utils import GetCurrentUserId
import server.queries.StudentDBqueries as DBQS
from .student_additional_lexis_funcs import (CreateFindPair, CreateScramble, CreateSpace, CreateTranslate)
from .additional_lexis_funcs import LexisTaskName, LexisTaskNameList
from ..routes_utils import GetCurrentUserId
from ...db_models import LexisType, Drilling, Hieroglyph
from .student_activity_funcs import ActivityFuncs


class LexisFuncs(ActivityFuncs):
    _activityQueries: DBQS.LexisQueries

    def AddNewDoneTasks(self, activityId: int):
        if not request.json:
            raise InvalidRequestJson()

        inDoneTasks = request.json.get("done_tasks", {})
        if not (inDoneTasks and isinstance(inDoneTasks, dict)):
            raise InvalidAPIUsage("Wrong data format", 403)

        lexisTry = self._activityQueries.GetUnfinishedTryByActivityId(activityId, GetCurrentUserId())
        doneTasks = lexisTry.getDoneTasksDict()
        for name, value in inDoneTasks.items():
            try:
                value = int(value)
            except ValueError:
                continue
            if isinstance(name, str) and name in LexisTaskNameList:
                doneTasks[name] = value
        doneTasksStr = ",".join([f"{name}:{value}" for name, value in doneTasks.items()])
        self._activityQueries.SetDoneTasksInTry(                                                                        #
            lexisTry.id,                                                                                                # type: ignore
            doneTasksStr)                                                                                               #
        return {"message": "Tasks updated!"}

    def GetById(self, activityId: int):
        lexis = self._activityQueries.GetById(activityId, GetCurrentUserId())
        lexis.now_try = self._activityQueries.GetUnfinishedTryByActivityId(activityId, GetCurrentUserId())

        tasks = {}
        tasks[LexisTaskName.CARD] = lexis.cards
        if not tasks[LexisTaskName.CARD]:
            raise InvalidAPIUsage("No cards in lexis", 403)

        wordsRU, wordsJP, charsJP = lexis.getCardWords()
        tasksNames = lexis.getTasksNames()

        if LexisTaskName.FINDPAIR in tasksNames:
            tasks[LexisTaskName.FINDPAIR] = CreateFindPair(wordsRU, wordsJP, charsJP)

        if LexisTaskName.SCRAMBLE in tasksNames:
            tasks[LexisTaskName.SCRAMBLE] = CreateScramble(wordsRU, wordsJP, charsJP)

        if LexisTaskName.TRANSLATE in tasksNames:
            tasks[LexisTaskName.TRANSLATE] = CreateTranslate(wordsRU, wordsJP, charsJP)

        if LexisTaskName.SPACE in tasksNames:
            tasks[LexisTaskName.SPACE] = CreateSpace(wordsRU, wordsJP, charsJP, self._activityQueries._activity_type)

        return {self._activityName: lexis, "items": tasks}


DrillingFuncs = LexisFuncs(Drilling)
HieroglyphFuncs = LexisFuncs(Hieroglyph)