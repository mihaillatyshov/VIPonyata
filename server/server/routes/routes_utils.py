import threading
from datetime import datetime, time, timedelta

from flask_login import current_user

from ..ApiExceptions import InvalidAPIUsage
from ..log_lib import LogI
from ..queries import OtherDBqueries as DBQO


def GetCurrentUserId() -> int:
    return current_user.GetId()                                                                                         # type: ignore


def GetCurrentUserIsTeacher() -> bool:
    return current_user.IsTeacher()                                                                                     # type: ignore


def GetCurrentUserIsStudent() -> bool:
    return current_user.IsStudent()                                                                                     # type: ignore


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


def DrillingEndTimeHandler(doneDrillingId: int):
    doneDrilling = DBQO.GetDoneDrillingById(doneDrillingId)
    if (doneDrilling and not doneDrilling.end_datetime):
        LogI("========= Not Hand ===============================")
        DBQO.UpdateDoneDrillingEndTime(doneDrillingId, datetime.now())
    LogI("========= Timer End ===============================")


def StartDrilingTimerLimit(timedeltaRemaining: timedelta, doneDrillingId: int):
    secondsRemaining = int(timedeltaRemaining.total_seconds())
    LogI("secondsRemaining", secondsRemaining)
    threading.Timer(secondsRemaining if secondsRemaining > 0 else 0, DrillingEndTimeHandler,
                    args={doneDrillingId}).start()


def OnRestartServerCheckTasksTimers():
    LogI("OnRestartServerCheckTasksTimers ==== START ====")
    doneDrillings = DBQO.GetCheckTasksTimersDrillings()
    LogI("OnRestartServerCheckTasksTimers:", doneDrillings)
    for doneDrilling in doneDrillings:
        timeRemaining = (doneDrilling.start_datetime + doneDrilling.drilling.time_limit__ToTimedelta()) - datetime.now()
        LogI("OnRestartServerCheckTasksTimers:", timeRemaining)
        StartDrilingTimerLimit(timeRemaining, doneDrilling.id)                                                          # type: ignore
    LogI("OnRestartServerCheckTasksTimers ==== END ====")
