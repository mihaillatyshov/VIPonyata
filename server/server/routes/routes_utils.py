import threading
from datetime import datetime, timedelta

from flask_login import current_user

from ..ApiExceptions import InvalidAPIUsage
from ..log_lib import LogI
from ..queries import OtherDBqueries as DBQO
from ..db_models import ActivityType, ActivityTryType, Drilling, DrillingTry, Hieroglyph, HieroglyphTry, Assessment, AssessmentTry


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


#########################################################################################################################
################ Activity Timer ############################################################################################
#########################################################################################################################
def ActivityEndTimeHandler(activityTryId: int, activityTry_type: ActivityTryType):
    activityTry = DBQO.GetActivityTryById(activityTryId, activityTry_type)
    if (activityTry and not activityTry.end_datetime):
        LogI("========= Not Hand ===============================")
        DBQO.UpdateActivityTryEndTime(activityTryId, datetime.now(), activityTry_type)
    LogI("========= Timer End ===============================")


# def DrillingEndTimeHandler(doneDrillingId: int):
#     doneDrilling = DBQO.GetDoneDrillingById(doneDrillingId)
#     if (doneDrilling and not doneDrilling.end_datetime):
#         LogI("========= Not Hand ===============================")
#         DBQO.UpdateLexisTryEndTime(doneDrillingId, datetime.now(), DrillingTry)
#     LogI("========= Timer End ===============================")


def StartActivityTimerLimit(timedeltaRemaining: timedelta, activityTryId: int, activityTry_type: ActivityTryType):
    secondsRemaining = int(timedeltaRemaining.total_seconds())
    LogI("secondsRemaining", secondsRemaining)
    threading.Timer(max(secondsRemaining, 0), ActivityEndTimeHandler, args={activityTryId, activityTry_type}).start()


def OnRestartServerCheckTasksTimersByType(activity_type: ActivityType, activityTry_type: ActivityTryType):
    LogI(f"OnRestartServerCheckTasksTimers ==== START ==== {activity_type.__name__}")
    activityTries = DBQO.GetActivityCheckTasksTimers(Drilling, DrillingTry)
    LogI("OnRestartServerCheckTasksTimers:", activityTries)
    for activityTry in activityTries:
        timeRemaining = (activityTry.start_datetime + activityTry.base.time_limit__ToTimedelta()) - datetime.now()
        LogI("OnRestartServerCheckTasksTimers:", timeRemaining)
        StartActivityTimerLimit(timeRemaining, activityTry.id, activityTry_type)                                        # type: ignore
    LogI(f"OnRestartServerCheckTasksTimers ==== END ==== {activity_type.__name__}")


def OnRestartServerCheckTasksTimers():
    OnRestartServerCheckTasksTimersByType(Drilling, DrillingTry)
    OnRestartServerCheckTasksTimersByType(Hieroglyph, HieroglyphTry)
    OnRestartServerCheckTasksTimersByType(Assessment, AssessmentTry)
