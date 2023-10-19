from typing import Generic

import server.queries.StudentDBqueries as DBQS
from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.models.db_models import (ActivityTryType, ActivityType, Assessment,
                                     Drilling, FinalBoss, Hieroglyph)
from server.routes.routes_utils import get_current_user_id


def get_activity_data(activity_type: type[ActivityType]) -> DBQS.ActivityQueries:
    if activity_type == Drilling:
        return DBQS.DrillingQueries
    if activity_type == Hieroglyph:
        return DBQS.HieroglyphQueries
    if activity_type == Assessment:
        return DBQS.AssessmentQueries
    if activity_type == FinalBoss:
        return DBQS.FinalBossQueries

    raise InvalidAPIUsage("Check server get_activity_data(activity_type: ActivityType)", 500)


class ActivityHandlers(Generic[ActivityType, ActivityTryType]):
    _activity_queries: DBQS.ActivityQueries[ActivityType, ActivityTryType]

    def __init__(self, activity_type: type[ActivityType]):
        self._activity_queries = get_activity_data(activity_type)

    def continue_try(self, activity_id: int):
        self._activity_queries.GetUnfinishedTryByActivityId(activity_id, get_current_user_id())
        return {"message": "Successfully continue"}
