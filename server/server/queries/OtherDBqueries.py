from datetime import datetime

from server.common import DBsession
from server.log_lib import LogW
from server.models.db_models import ActivityTryType, ActivityType


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


def UpdateActivityTryEndTime(activity_try_id: int, endTime: datetime, activityTry_type: ActivityTryType) -> None:
    if activity_try := DBsession().query(activityTry_type).filter(activityTry_type.id == activity_try_id).one_or_none():
        activity_try.end_datetime = endTime
        DBsession().add(activity_try)
        DBsession().commit()
