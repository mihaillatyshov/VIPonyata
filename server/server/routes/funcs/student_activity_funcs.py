from typing import Generic

import server.queries.StudentDBqueries as DBQS
from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.models.db_models import (ActivityTryType, ActivityType, Assessment,
                                     Drilling, FinalBoss, Hieroglyph)
from server.routes.routes_utils import get_current_user_id


def get_activity_data(activity_type: type[ActivityType]) -> tuple[DBQS.ActivityQueries, str]:
    if activity_type == Drilling:
        return DBQS.DrillingQueries, "drilling"
    if activity_type == Hieroglyph:
        return DBQS.HieroglyphQueries, "hieroglyph"
    if activity_type == Assessment:
        return DBQS.AssessmentQueries, "assessment"
    if activity_type == FinalBoss:
        return DBQS.FinalBossQueries, "final_boss"

    raise InvalidAPIUsage("Check server get_activity_data(activity_type: ActivityType)", 500)


class ActivityFuncs(Generic[ActivityType, ActivityTryType]):
    _activityQueries: DBQS.ActivityQueries[ActivityType, ActivityTryType]
    _activityName: str

    def __init__(self, activity_type: type[ActivityType]):
        self._activityQueries, self._activityName = get_activity_data(activity_type)

    def continue_try(self, activity_id: int):
        self._activityQueries.GetUnfinishedTryByActivityId(activity_id, get_current_user_id())
        return {"message": "Successfully continue"}
