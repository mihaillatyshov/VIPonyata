from typing import Generic

import server.queries.StudentDBqueries as DBQS
from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.models.db_models import (ActivityTryType, ActivityType, Assessment,
                                     Drilling, FinalBoss, Hieroglyph,
                                     time_limit_to_timedelta)
from server.routes.routes_utils import (activity_end_time_handler,
                                        get_current_user_id,
                                        start_activity_timer_limit)


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

    def start_new_try(self, activity_id: int):
        activity = self._activityQueries.GetById(activity_id, get_current_user_id())
        activity_tries = self._activityQueries.GetTriesByActivityId(activity_id, get_current_user_id())

        if activity_tries and activity_tries[-1].end_datetime == None:
            return {"message": "Lexis try already Exists"}, 409

        new_activity_try = self._activityQueries.AddNewTry(len(activity_tries) + 1, activity_id, get_current_user_id())

        if activity.time_limit and new_activity_try:
            start_activity_timer_limit(time_limit_to_timedelta(activity.time_limit), new_activity_try.id,
                                       self._activityQueries._activityTry_type)
        return {"message": "Lexis try successfully created"}

    def continue_try(self, activity_id: int):
        self._activityQueries.GetUnfinishedTryByActivityId(activity_id, get_current_user_id())
        return {"message": "Successfully continue"}

    def end_try(self, activity_id: int):
        activity_try = self._activityQueries.GetUnfinishedTryByActivityId(activity_id, get_current_user_id())
        activity_end_time_handler(activity_try.id, self._activityQueries._activityTry_type)
        return {"message": "Successfully closed"}
