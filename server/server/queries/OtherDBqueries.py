from datetime import datetime

from server.common import DBsession
from server.log_lib import LogW
from server.models.db_models import (ActivityTryType, ActivityType,
                                     AssessmentTry, Drilling, DrillingTry,
                                     FinalBossTry, Hieroglyph, HieroglyphTry,
                                     LexisTryType, User,
                                     UserDictionary)
from server.models.user import UserRegisterReq
from server.queries.StudentDBqueries import (add_assessment_notification,
                                             add_drilling_notification,
                                             add_final_boss_notification,
                                             add_hieroglyph_notification)


#########################################################################################################################
################ On Restart #############################################################################################
#########################################################################################################################
def get_activity_check_tasks_timers(activity_type: ActivityType,
                                    activity_try_type: ActivityTryType) -> list[ActivityTryType]:
    LogW("GetActivityCheckTasksTimers", activity_type.__name__, activity_try_type.__name__)

    return (
        DBsession
        .query(activity_try_type)
        .filter(activity_try_type.end_datetime == None)
        .join(activity_try_type.base)
        .filter(activity_type.time_limit != None)
        .all()
    )


def get_activity_try_by_id(activity_try_id: int, activity_try_type: ActivityTryType) -> ActivityTryType | None:
    return DBsession.query(activity_try_type).filter(activity_try_type.id == activity_try_id).one_or_none()


def update_activity_try_end_time(activity_try_id: int, end_time: datetime, activity_try_type: ActivityTryType) -> None:
    activity_try: ActivityTryType = (DBsession
                                     .query(activity_try_type)
                                     .filter(activity_try_type.id == activity_try_id)
                                     .one_or_none())
    if activity_try:
        if activity_try_type == FinalBossTry:
            add_final_boss_notification(activity_try.id)
        if activity_try_type == AssessmentTry:
            add_assessment_notification(activity_try.id)
        elif activity_try_type == DrillingTry:
            add_drilling_notification(activity_try.id)
            add_user_dictionary_from_try(activity_try)
        elif activity_try_type == HieroglyphTry:
            add_hieroglyph_notification(activity_try.id)
            add_user_dictionary_from_try(activity_try)

        activity_try.end_datetime = end_time
        DBsession.add(activity_try)
        DBsession.commit()


#########################################################################################################################
################ User ###################################################################################################
#########################################################################################################################
def create_new_user(user_data: UserRegisterReq, hash_pwd):
    DBsession.add(
        User(name=user_data.name, nickname=user_data.nickname, password=hash_pwd, birthday=user_data.birthday, level=0))
    DBsession.commit()


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
def add_user_dictionary_from_try(activity_try: LexisTryType):
    lexis: Drilling | Hieroglyph = activity_try.base

    for card in lexis.cards:
        dictinary = (
            DBsession                                                                                                   #
            #
            .query(UserDictionary)
            .filter(UserDictionary.dictionary_id == card.dictionary_id)                                                 #
            .filter(UserDictionary.user_id == activity_try.user_id)                                                     #
            .one_or_none()                                                                                              #
        )

        if dictinary is None:
            user_dictionary = UserDictionary(user_id=activity_try.user_id, dictionary_id=card.dictionary_id)
            DBsession.add(user_dictionary)
            DBsession.commit()
