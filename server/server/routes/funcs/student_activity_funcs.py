from ...ApiExceptions import InvalidAPIUsage
from ...db_models import ActivityType, Assessment, Drilling, Hieroglyph
from ...queries import StudentDBqueries as DBQS
from ..routes_utils import (ActivityEndTimeHandler, GetCurrentUserId, StartActivityTimerLimit)


def GetActivityData(activity_type: ActivityType) -> tuple[DBQS.ActivityQueries, str]:
    if activity_type == Drilling:
        return DBQS.DrillingQueries, "drilling"
    if activity_type == Hieroglyph:
        return DBQS.HieroglyphQueries, "hieroglyph"
    if activity_type == Assessment:
        return DBQS.AssessmentQueries, "assessment"

    raise InvalidAPIUsage("Check server GetActivityData()", 500)


class ActivityFuncs:
    _activityQueries: DBQS.ActivityQueries
    _activityName: str

    def __init__(self, activity_type: ActivityType):
        self._activityQueries, self._activityName = GetActivityData(activity_type)

    def StartNewTry(self, activityId: int):
        activity = self._activityQueries.GetById(activityId, GetCurrentUserId())
        activityTries = self._activityQueries.GetTriesByActivityId(activityId, GetCurrentUserId())

        if activityTries and activityTries[-1].end_datetime == None:
            return {"message": "Lexis try already Exists"}, 409

        newActivityTry = self._activityQueries.AddNewTry(len(activityTries) + 1, activityId, GetCurrentUserId())

        if activity.time_limit and newActivityTry:
            StartActivityTimerLimit(                                                                                    #
                activity.time_limit__ToTimedelta(),                                                                     #
                newActivityTry.id,                                                                                      # type: ignore
                self._activityQueries._activityTry_type)                                                                #
        return {"message": "Lexis try successfully created"}

    def ContinueTry(self, activityId: int):
        self._activityQueries.GetUnfinishedTryByActivityId(activityId, GetCurrentUserId())
        return {"message": "Successfully continue"}

    def EndTry(self, activityId: int):
        activityTry = self._activityQueries.GetUnfinishedTryByActivityId(activityId, GetCurrentUserId())
        ActivityEndTimeHandler(                                                                                         #
            activityTry.id,                                                                                             # type: ignore
            self._activityQueries._activityTry_type)                                                                    #
        return {"message": "Successfully closed"}
