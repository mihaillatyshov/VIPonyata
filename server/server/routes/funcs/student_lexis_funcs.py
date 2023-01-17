from ...ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from ..routes_utils import GetCurrentUserId
from .student_additional_lexis_funcs import (CreateFindPair, CreateScramble, CreateSpace, CreateTranslate, GetLexisData,
                                             LexisTaskName)


def GetLexisById(lexisId: int, lexisType: int):
    DB_GetLexisById, DB_GetUnfinishedDoneLexisByLexisId, lexisName = GetLexisData(lexisType)

    lexis = DB_GetLexisById(lexisId, GetCurrentUserId())
    lexis.now_try = DB_GetUnfinishedDoneLexisByLexisId(lexisId, GetCurrentUserId())                                     # type: ignore

    tasks = {}
    # Drilling Card
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
        tasks[LexisTaskName.SPACE] = CreateSpace(wordsRU, wordsJP, charsJP, lexisType)

    return {lexisName: lexis, "items": tasks}
