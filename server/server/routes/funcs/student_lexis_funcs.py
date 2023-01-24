from flask import request
from ...ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from ..routes_utils import GetCurrentUserId
from ...queries import StudentDBqueries as DBQS
from .student_additional_lexis_funcs import (CreateFindPair, CreateScramble, CreateSpace, CreateTranslate, GetLexisData,
                                             LexisTypeEnum, LexisTaskName, LexisTaskNameList)
from ..routes_utils import ActivityEndTimeHandler, GetCurrentUserId, StartActivityTimerLimit


class LexisFuncs:
    lexisQueries: DBQS.LexisQueries
    lexisName: str
    lexisType: int

    def __init__(self, lexisType: int):
        self.lexisQueries, self.lexisName = GetLexisData(lexisType)
        self.lexisType = lexisType

    def StartNewLexisTry(self, lexisId: int):
        lexis = self.lexisQueries.GetLexisById(lexisId, GetCurrentUserId())
        lexisTries = self.lexisQueries.GetLexisTriesByLexisId(lexisId, GetCurrentUserId())

        if lexisTries and lexisTries[-1].end_datetime == None:
            return {"message": "Already Exists"}, 409

        newLexisTry = self.lexisQueries.AddNewLexisTry(len(lexisTries) + 1, lexisId, GetCurrentUserId())

        if lexis.time_limit and newLexisTry:
            StartActivityTimerLimit(                                                                                    #
                lexis.time_limit__ToTimedelta(),                                                                        #
                newLexisTry.id,                                                                                         # type: ignore
                self.lexisQueries.lexisTry_type)                                                                        #
        return {"message": "Successfully created"}

    def ContinueLexisTry(self, lexisId: int):
        self.lexisQueries.GetUnfinishedLexisTryByLexisId(lexisId, GetCurrentUserId())
        return {"message": "Successfully continue"}

    def EndLexisTry(self, lexisId: int):
        lexisTry = self.lexisQueries.GetUnfinishedLexisTryByLexisId(lexisId, GetCurrentUserId())
        ActivityEndTimeHandler(                                                                                         #
            lexisTry.id,                                                                                                # type: ignore
            self.lexisQueries.lexisTry_type)                                                                            #
        return {"message": "Successfully closed"}

    def AddLexisNewDoneTasks(self, lexisId: int):
        if not request.json:
            raise InvalidRequestJson()

        inDoneTasks = request.json.get("done_tasks", {})
        if not (inDoneTasks and isinstance(inDoneTasks, dict)):
            raise InvalidAPIUsage("Wrong data format", 403)

        lexisTry = self.lexisQueries.GetUnfinishedLexisTryByLexisId(lexisId, GetCurrentUserId())
        doneTasks = lexisTry.getDoneTasksDict()
        for name, value in inDoneTasks.items():
            try:
                value = int(value)
            except ValueError:
                continue
            if isinstance(name, str) and name in LexisTaskNameList:
                doneTasks[name] = value
        doneTasksStr = ",".join([f"{name}:{value}" for name, value in doneTasks.items()])
        self.lexisQueries.SetDoneTasksInLexisTry(                                                                       #
            lexisTry.id,                                                                                                # type: ignore
            doneTasksStr)                                                                                               #
        return {"message": "Tasks updated!"}

    def GetLexisById(self, lexisId: int):
        lexis = self.lexisQueries.GetLexisById(lexisId, GetCurrentUserId())
        lexis.now_try = self.lexisQueries.GetUnfinishedLexisTryByLexisId(lexisId, GetCurrentUserId())

        tasks = {}
        tasks[LexisTaskName.CARD] = lexis.cards
        if not tasks[LexisTaskName.CARD]:
            raise InvalidAPIUsage("No cards in drilling", 403)

        wordsRU, wordsJP, charsJP = lexis.getCardWords()
        tasksNames = lexis.getTasksNames()

        if LexisTaskName.FINDPAIR in tasksNames:
            tasks[LexisTaskName.FINDPAIR] = CreateFindPair(wordsRU, wordsJP, charsJP)

        if LexisTaskName.SCRAMBLE in tasksNames:
            tasks[LexisTaskName.SCRAMBLE] = CreateScramble(wordsRU, wordsJP, charsJP)

        if LexisTaskName.TRANSLATE in tasksNames:
            tasks[LexisTaskName.TRANSLATE] = CreateTranslate(wordsRU, wordsJP, charsJP)

        if LexisTaskName.SPACE in tasksNames:
            tasks[LexisTaskName.SPACE] = CreateSpace(wordsRU, wordsJP, charsJP, self.lexisType)

        return {self.lexisName: lexis, "items": tasks}


DrillingFuncs = LexisFuncs(LexisTypeEnum.DRILLING)
HieroglyphFuncs = LexisFuncs(LexisTypeEnum.HIEROGLYPH)