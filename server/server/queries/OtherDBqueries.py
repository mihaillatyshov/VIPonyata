from datetime import datetime

from ..db_models import ActivityType, ActivityTryType, CreateSessionFromJsonFile
from ..log_lib import LogW
from .DBqueriesUtils import *


def GetActivityCheckTasksTimers(activity_type: ActivityType,
                                activityTry_type: ActivityTryType) -> list[ActivityTryType]:
    LogW("GetActivityCheckTasksTimers", activity_type.__name__, activityTry_type.__name__)

    return (                                                                                                            #
        DBsession()                                                                                                     #
        .query(activityTry_type)                                                                                        #
        .filter(activityTry_type.end_datetime == None)                                                                  #
        .join(activityTry_type.base)                                                                                    #
        .filter(activity_type.time_limit != None)                                                                       #
        .all()                                                                                                          #
    )                                                                                                                   #


def GetActivityTryById(activityTryId: int, activityTry_type: ActivityTryType) -> ActivityTryType | None:
    return DBsession().query(activityTry_type).filter(activityTry_type.id == activityTryId).one_or_none()


def UpdateActivityTryEndTime(activityTryId: int, endTime: datetime, activityTry_type: ActivityTryType) -> None:
    if activityTry := DBsession().query(activityTry_type).filter(activityTry_type.id == activityTryId).one_or_none():
        activityTry.end_datetime = endTime
        DBsession().add(activityTry)
        DBsession().commit()
