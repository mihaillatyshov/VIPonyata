from flask import request

from ...ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from ...queries import StudentDBqueries as DBQS
from ..routes_utils import DrillingEndTimeHandler, GetCurrentUserId, StartDrilingTimerLimit

from .student_additional_lexis_funcs import LexisTaskNameList, LexisType
from .student_lexis_funcs import GetLexisById


def startNewDrillingTry(drillingId: int):
    drilling = DBQS.GetDrillingById(drillingId, GetCurrentUserId())
    doneDrillings = DBQS.GetDoneDrillingsByDrillingId(drillingId, GetCurrentUserId())
    # TODO Remove check of length ???

    if doneDrillings and doneDrillings[-1].end_datetime == None:
        return {"message": "Already Exists"}, 409

    newDoneDrilling = DBQS.AddNewDoneDrilling(len(doneDrillings) + 1, drillingId, GetCurrentUserId())

    if drilling.time_limit and newDoneDrilling:
        StartDrilingTimerLimit(drilling.time_limit__ToTimedelta(), newDoneDrilling.id)                                  # type: ignore
    return {"message": "Successfully created"}


def continueDrilingTry(drillingId: int):
    DBQS.GetUnfinishedDoneDrillingsByDrillingId(drillingId, GetCurrentUserId())
    return {"message": "Successfully continue"}


def endDrillingTry(drillingId: int):
    doneDrilling = DBQS.GetUnfinishedDoneDrillingsByDrillingId(drillingId, GetCurrentUserId())
    DrillingEndTimeHandler(doneDrilling.id)                                                                             # type: ignore
    return {"message": "Successfully closed"}


def addNewDoneTask(drillingId: int):
    if not request.json:
        raise InvalidRequestJson()

    inDoneTasks = request.json.get("done_tasks", {})
    if not (inDoneTasks and isinstance(inDoneTasks, dict)):
        raise InvalidAPIUsage("Wrong data format", 403)

    doneDrilling = DBQS.GetUnfinishedDoneDrillingsByDrillingId(drillingId, GetCurrentUserId())
    doneTasks = doneDrilling.getDoneTasksDict()
    for name, value in inDoneTasks.items():
        try:
            value = int(value)
        except ValueError:
            continue
        if isinstance(name, str) and name in LexisTaskNameList:
            doneTasks[name] = value
    doneTasksStr = ",".join([f"{name}:{value}" for name, value in doneTasks.items()])
    DBQS.SetDoneTaskInDoneDrilling(doneDrilling.id, doneTasksStr)                                                       # type: ignore
    return {"message": "Tasks updated!"}


def getDrillingById(drillingId: int):
    return GetLexisById(drillingId, LexisType.DRILLING)
