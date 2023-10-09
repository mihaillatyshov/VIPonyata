from datetime import datetime

from server.common import DBsession
from server.log_lib import LogW
from server.models.db_models import (ActivityTryType, ActivityType, AssessmentTry, DrillingTry, FinalBossTry,
                                     HieroglyphTry, LexisType, User, UserDictionary)
from server.models.user import UserRegisterReq
from server.queries.StudentDBqueries import (add_assessment_notification, add_drilling_notification,
                                             add_final_boss_notification, add_hieroglyph_notification)


#########################################################################################################################
################ On Restart #############################################################################################
#########################################################################################################################
def GetActivityCheckTasksTimers(activity_type: ActivityType,
                                activityTry_type: ActivityTryType) -> list[ActivityTryType]:
    LogW("GetActivityCheckTasksTimers", activity_type.__name__, activityTry_type.__name__)

    return (                                                                                                            #
        DBsession                                                                                                       #
        .query(activityTry_type)                                                                                        #
        .filter(activityTry_type.end_datetime == None)                                                                  #
        .join(activityTry_type.base)                                                                                    #
        .filter(activity_type.time_limit != None)                                                                       #
        .all()                                                                                                          #
    )                                                                                                                   #


def GetActivityTryById(activityTryId: int, activityTry_type: ActivityTryType) -> ActivityTryType | None:
    return DBsession.query(activityTry_type).filter(activityTry_type.id == activityTryId).one_or_none()


def UpdateActivityTryEndTime(activity_try_id: int, endTime: datetime, activityTry_type: ActivityTryType) -> None:
    if activity_try := DBsession.query(activityTry_type).filter(activityTry_type.id == activity_try_id).one_or_none():
        if activityTry_type == FinalBossTry:
            add_final_boss_notification(activity_try.id)
        if activityTry_type == AssessmentTry:
            add_assessment_notification(activity_try.id)
        elif activityTry_type == DrillingTry:
            add_drilling_notification(activity_try.id)
            add_user_dictionary_from_try(activity_try)
        elif activityTry_type == HieroglyphTry:
            add_hieroglyph_notification(activity_try.id)
            add_user_dictionary_from_try(activity_try)

        activity_try.end_datetime = endTime
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
def add_user_dictionary_from_try(activity_try: DrillingTry | HieroglyphTry):
    lexis: LexisType = activity_try.base

    for card in lexis.cards:
        dictinary = (
            DBsession                                                                                                   #
            .query(UserDictionary)                                                                                      #
            .filter(UserDictionary.dictionary_id == card.dictionary_id)                                                 #
            .filter(UserDictionary.user_id == activity_try.user_id)                                                     #
            .one_or_none()                                                                                              #
        )

        if dictinary is None:
            user_dictionary = UserDictionary(user_id=activity_try.user_id, dictionary_id=card.dictionary_id)
            DBsession.add(user_dictionary)
            DBsession.commit()
