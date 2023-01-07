import threading
from datetime import datetime, time, timedelta

from flask_login import current_user

from ..ApiExceptions import InvalidAPIUsage
from ..log_lib import LogI
from ..queries import OtherDBqueries as DBQO


class DrillingTaskName:
    CARD = "card"
    FINDPAIR = "findpair"
    SCRAMBLE = "scramble"
    TRANSLATE = "translate"
    SPACE = "space"


DrillingTaskNameList = [value for name, value in vars(DrillingTaskName).items() if not callable(
    getattr(DrillingTaskName, name)) and not name.startswith("__")]


def GetCurrentUserId() -> int:
    return current_user.GetId()  # type: ignore


def GetCurrentUserIsTeacher() -> bool:
    return current_user.IsTeacher()  # type: ignore


def GetCurrentUserIsStudent() -> bool:
    return current_user.IsStudent()  # type: ignore


def DrillingEndTimeHandler(doneDrillingId: int):
    doneDrilling = DBQO.GetDoneDrillingById(doneDrillingId)
    if (doneDrilling and not doneDrilling.end_datetime):
        LogI("========= Not Hand ===============================")
        DBQO.UpdateDoneDrillingEndTime(doneDrillingId, datetime.now())
    LogI("========= Timer End ===============================")


def TimeToTimedelta(time: time) -> timedelta:
    return timedelta(hours=time.hour, minutes=time.minute, seconds=time.second, microseconds=time.microsecond)


def CalcTasksDeadline(timeLimit: time, datetimeStart: datetime) -> datetime:
    return datetimeStart + TimeToTimedelta(timeLimit)


def CalcTimeRemaining(timeLimit: time, datetimeStart: datetime) -> timedelta:
    timeNow = datetime.now()
    endTime = CalcTasksDeadline(timeLimit, datetimeStart)
    return endTime - timeNow


def StartDrilingTimerLimit(timedeltaRemaining: timedelta, doneDrillingId: int):
    secondsRemaining = int(timedeltaRemaining.total_seconds())
    LogI("secondsRemaining", secondsRemaining)
    threading.Timer(secondsRemaining if secondsRemaining > 0 else 0,
                    DrillingEndTimeHandler, args={doneDrillingId}).start()


def UserSelectorFunction(teacherFunc=None, studentFunc=None, *args, **kwargs) -> dict | tuple:
    if GetCurrentUserIsTeacher():
        if not teacherFunc:
            raise InvalidAPIUsage("You are not student!", 403)
        return teacherFunc(*args, **kwargs)
    if GetCurrentUserIsStudent():
        if not studentFunc:
            raise InvalidAPIUsage("You are not teacher!", 403)
        return studentFunc(*args, **kwargs)

    raise InvalidAPIUsage("User level error!", 400)


def OnRestartServerCheckTasksTimers():
    LogI("OnRestartServerCheckTasksTimers ==== START ====")
    doneDrillings = DBQO.GetCheckTasksTimersDrillings()
    LogI("OnRestartServerCheckTasksTimers:", doneDrillings)
    for doneDrilling in doneDrillings:
        timeRemaining = CalcTimeRemaining(doneDrilling.drilling.time_limit,
                                          doneDrilling.start_datetime)                                                  # type: ignore
        LogI("timeRemaining:", timeRemaining)
        LogI("OnRestartServerCheckTasksTimers:", timeRemaining)
        StartDrilingTimerLimit(timeRemaining, doneDrilling.id)                                                          # type: ignore
        LogI("OnRestartServerCheckTasksTimers:", doneDrilling.drilling.time_limit,
             doneDrilling.start_datetime, doneDrilling.id)
    LogI("OnRestartServerCheckTasksTimers ==== END ====")
