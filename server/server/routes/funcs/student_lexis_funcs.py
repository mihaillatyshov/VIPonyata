from flask import request

import server.queries.StudentDBqueries as DBQS
from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.models.db_models import Drilling, Hieroglyph, LexisType
from server.routes.funcs.additional_lexis_funcs import (LexisTaskName, LexisTaskNameList)
from server.routes.funcs.student_activity_funcs import ActivityFuncs
from server.routes.funcs.student_additional_lexis_funcs import (CreateFindPair, CreateScramble, CreateSpace,
                                                                CreateTranslate)
from server.routes.routes_utils import GetCurrentUserId


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
        doneTasksStr = ",".join([f"{name}: {value}" for name, value in doneTasks.items()])
        self._activityQueries.set_done_tasks_in_try(lexisTry.id, doneTasksStr)
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

            print(tasks[LexisTaskName.FINDPAIR])

            print("==========================")
            for i in tasks[LexisTaskName.FINDPAIR]["answers"]["words_ru"]:
                print(tasks[LexisTaskName.FINDPAIR]["words_ru"][i])
            print()
            for i in tasks[LexisTaskName.FINDPAIR]["answers"]["words_jp"]:
                print(tasks[LexisTaskName.FINDPAIR]["words_jp"][i])
            print("==========================")

        if LexisTaskName.SCRAMBLE in tasksNames:
            tasks[LexisTaskName.SCRAMBLE] = CreateScramble(wordsRU, wordsJP, charsJP)

        if LexisTaskName.TRANSLATE in tasksNames:
            tasks[LexisTaskName.TRANSLATE] = CreateTranslate(wordsRU, wordsJP, charsJP)

        if LexisTaskName.SPACE in tasksNames:
            tasks[LexisTaskName.SPACE] = CreateSpace(wordsRU, wordsJP, charsJP, self._activityQueries._activity_type)

        return {self._activityName: lexis, "items": tasks}


DrillingFuncs = LexisFuncs(Drilling)
HieroglyphFuncs = LexisFuncs(Hieroglyph)
