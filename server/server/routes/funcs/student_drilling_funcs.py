import random

from flask import request

from ...ApiExceptions import InvalidRequestJson
from ...queries import StudentDBqueries as DBQS
from ..routes_utils import (CalcTasksDeadline, DrillingEndTimeHandler,
                            DrillingTaskName, DrillingTaskNameList,
                            GetCurrentUserId, StartDrilingTimerLimit,
                            TimeToTimedelta)


def startNewDrillingTry(drillingId: int):
    if drilling := DBQS.GetDrillingById(drillingId, GetCurrentUserId()):
        doneDrillings = DBQS.GetDoneDrillingsByDrillingId(drillingId, GetCurrentUserId())
        length = len(doneDrillings) if doneDrillings else 0

        if doneDrillings and doneDrillings[-1].end_datetime == None:
            return {"message": "Already Exists"}, 409

        newDoneDrilling = DBQS.AddNewDoneDrilling(length + 1, drillingId, GetCurrentUserId())

        if drilling.time_limit and newDoneDrilling:
            StartDrilingTimerLimit(
                TimeToTimedelta(drilling.time_limit),                                                                   # type: ignore
                newDoneDrilling.id)                                                                                     # type: ignore
        return {"message": f"Successfully created"}

    return {"message": "You have no access to this lesson!"}, 403


def continueDrilingTry(drillingId: int):
    if DBQS.GetUnfinishedDoneDrillingsByDrillingId(drillingId, GetCurrentUserId()):
        return {"message": "Successfully continue"}

    return {"message": "You have no access to this lesson!"}, 403


def endDrillingTry(drillingId: int):
    if doneDrilling := DBQS.GetUnfinishedDoneDrillingsByDrillingId(drillingId, GetCurrentUserId()):
        DrillingEndTimeHandler(doneDrilling.id)                                                                         # type: ignore
        return {"message": "Successfully closed"}

    return {"message": "Already closed"}, 403


def addNewDoneTask(drillingId: int):
    if not request.json:
        raise InvalidRequestJson()

    inDoneTasks = request.json.get("done_tasks", {})
    if inDoneTasks and isinstance(inDoneTasks, dict):
        if doneDrilling := DBQS.GetUnfinishedDoneDrillingsByDrillingId(drillingId, GetCurrentUserId()):
            doneTasks = doneDrilling.getDoneTasksDict()
            for name, value in inDoneTasks.items():
                try:
                    value = int(value)
                except ValueError:
                    continue
                if isinstance(name, str) and name in DrillingTaskNameList:
                    doneTasks[name] = value
            doneTasksStr = ",".join([f"{name}:{value}" for name, value in doneTasks.items()])
            DBQS.SetDoneTaskInDoneDrilling(doneDrilling.id, doneTasksStr)                                               # type: ignore
        return {"message": "Tasks updated!"}

    return {"message": "something wrong"}, 403


def getDrillingById(drillingId: int):
    if drilling := DBQS.GetDrillingById(drillingId, GetCurrentUserId()):
        if doneDrilling := DBQS.GetUnfinishedDoneDrillingsByDrillingId(drillingId, GetCurrentUserId()):
            drilling.now_try = doneDrilling                                                                             # type: ignore

            if drilling.time_limit:
                drilling.deadline = CalcTasksDeadline(                                                                  # type: ignore
                    drilling.time_limit, doneDrilling.start_datetime)                                                   # type: ignore

            tasks = {}
            wordsRU = []
            wordsJP = []
            # Drilling Card
            tasks[DrillingTaskName.CARD] = drilling.cards
            if tasks[DrillingTaskName.CARD]:
                # Get Words from dictionary
                for card in tasks[DrillingTaskName.CARD]:
                    wordsRU.append(card.dictionary.ru)
                    wordsJP.append(card.dictionary.word_jp)

                tasksNames = drilling.tasks.split(",")

                # Drilling Find Pair
                if DrillingTaskName.FINDPAIR in tasksNames:
                    shuffleWordsRU = wordsRU.copy()
                    random.shuffle(shuffleWordsRU)
                    shuffleWordsJP = wordsJP.copy()
                    random.shuffle(shuffleWordsJP)
                    answers = {"words_ru": [], "words_jp": []}
                    for word in shuffleWordsRU:
                        answers["words_ru"].append(shuffleWordsRU.index(word))
                        answers["words_jp"].append(shuffleWordsJP.index(wordsJP[wordsRU.index(word)]))
                    # print(answers)
                    tasks[DrillingTaskName.FINDPAIR] = {
                        "words_ru": shuffleWordsRU, "words_jp": shuffleWordsJP, "answers": answers}

                # Drilling Scramble
                if DrillingTaskName.SCRAMBLE in tasksNames:
                    shuffleWordsJP = wordsJP.copy()
                    random.shuffle(shuffleWordsJP)
                    chars = []
                    for word in shuffleWordsJP:
                        chars.append(list(word))
                        random.shuffle(chars[-1])
                    #print("SWJP", shuffleWordsJP)
                    #print("Chars", chars)
                    tasks[DrillingTaskName.SCRAMBLE] = {
                        "words": shuffleWordsJP, "chars": chars}

                # Drilling Translate
                if DrillingTaskName.TRANSLATE in tasksNames:
                    tasks[DrillingTaskName.TRANSLATE] = {
                        "words_jp": wordsJP, "words_ru": wordsRU}

                # Drilling Space
                if DrillingTaskName.SPACE in tasksNames:
                    spaceWords = []
                    for i in range(len(wordsJP)):
                        word = wordsJP[i]
                        if len(word) == 1:
                            spaceWords.append(
                                {"word_jp": word, "word_ru": wordsRU[i], "word_start": "", "word_end": "", "spaces": 1})
                        elif len(word) == 2:
                            spaceWords.append(
                                {"word_jp": word, "word_ru": wordsRU[i],
                                 "word_start": "", "word_end": word[-1],
                                 "spaces": 2})
                        else:
                            spaceWords.append(
                                {"word_jp": word, "word_ru": wordsRU[i],
                                 "word_start": word[0],
                                 "word_end": word[-1],
                                 "spaces": len(word) - 2})
                    tasks[DrillingTaskName.SPACE] = {"words": spaceWords}

            return {"drilling": drilling, "items": tasks}

    return {"drilling": None, "items": None}, 403
