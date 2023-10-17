from datetime import datetime

from sqlalchemy import select

from server.common import DBsession
from server.log_lib import LogW
from server.models.db_models import (ActivityTryType, ActivityType, AssessmentTry, DrillingTry, FinalBossTry,
                                     HieroglyphTry, LexisTryType, User)
from server.models.user import UserRegisterReq
from server.queries.StudentDBqueries import (add_assessment_notification, add_drilling_notification,
                                             add_final_boss_notification, add_hieroglyph_notification,
                                             add_user_dictionary_if_not_exists)


#########################################################################################################################
################ On Restart #############################################################################################
#########################################################################################################################
def get_activity_check_tasks_timers(activity_type: type[ActivityType],
                                    activity_try_type: type[ActivityTryType]) -> list[tuple[ActivityType, ActivityTryType]]:
    LogW("GetActivityCheckTasksTimers", activity_type.__name__, activity_try_type.__name__)

    with DBsession.begin() as session:
        return session.execute(
            select(activity_type, activity_try_type)
            .where(activity_try_type.end_datetime == None)
            .join(activity_try_type.base)
            .where(activity_type.time_limit != None)
        ).all()


def get_activity_try_by_id(activity_try_id: int, activity_try_type: type[ActivityTryType]) -> ActivityTryType | None:
    with DBsession.begin() as session:
        return session.scalars(select(activity_try_type).where(activity_try_type.id == activity_try_id)).one_or_none()


def update_activity_try_end_time(activity_try_id: int, end_time: datetime,
                                 activity_try_type: type[ActivityTryType]) -> None:
    with DBsession.begin() as session:
        activity_try: ActivityTryType = session.scalars(
            select(activity_try_type).where(activity_try_type.id == activity_try_id)).one_or_none()
        if activity_try is None:
            return
        if activity_try_type == FinalBossTry:
            add_final_boss_notification(activity_try_id)
        if activity_try_type == AssessmentTry:
            add_assessment_notification(activity_try_id)
        elif activity_try_type == DrillingTry and isinstance(activity_try, DrillingTry):
            add_drilling_notification(activity_try_id)
            add_user_dictionary_from_try(activity_try)
        elif activity_try_type == HieroglyphTry and isinstance(activity_try, HieroglyphTry):
            add_hieroglyph_notification(activity_try_id)
            add_user_dictionary_from_try(activity_try)

        activity_try.end_datetime = end_time


#########################################################################################################################
################ User ###################################################################################################
#########################################################################################################################
def create_new_user(user_data: UserRegisterReq, hash_pwd):
    with DBsession.begin() as session:
        session.add(
            User(name=user_data.name,
                 nickname=user_data.nickname,
                 password=hash_pwd,
                 birthday=user_data.birthday,
                 level=0))


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
def add_user_dictionary_from_try(activity_try: LexisTryType):
    lexis = activity_try.base

    for card in lexis.cards:
        add_user_dictionary_if_not_exists(card.dictionary_id, activity_try.user_id)
