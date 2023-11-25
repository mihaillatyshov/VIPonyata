from datetime import datetime

from sqlalchemy import select, update

import server.queries.OtherDBqueries as DBQO
import server.queries.StudentDBqueries as DBQS
import server.queries.TeacherDBqueries as DBQT
import server.handlers.teacher.assessment_handlers as TAH
from server.common import DBsession
from server.log_lib import LogW
from server.models.db_models import (ActivityTryType, ActivityType,
                                     AssessmentTry, DrillingTry, FinalBossTry,
                                     HieroglyphTry, LexisTryType, User)
from server.models.user import UserDataUpdateReq, UserRegisterReq

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
            DBQS.add_final_boss_notification(activity_try_id)
            if TAH.FinalBossHandlers.is_try_checked(activity_try_id):
                DBQT.add_final_boss_notification()
        if activity_try_type == AssessmentTry:
            DBQS.add_assessment_notification(activity_try_id)
            if TAH.AssessmentHandlers.is_try_checked(activity_try_id):
                DBQT.add_assessment_notification()
        elif activity_try_type == DrillingTry and isinstance(activity_try, DrillingTry):
            DBQS.add_drilling_notification(activity_try_id)
            DBQO.add_user_dictionary_from_try(activity_try)
        elif activity_try_type == HieroglyphTry and isinstance(activity_try, HieroglyphTry):
            DBQS.add_hieroglyph_notification(activity_try_id)
            DBQO.add_user_dictionary_from_try(activity_try)

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


def get_user_by_id(user_id: int) -> User | None:
    with DBsession.begin() as session:
        return session.scalars(select(User).where(User.id == user_id)).one_or_none()


def user_data_update(user_data: UserDataUpdateReq, user_id: int):
    with DBsession.begin() as session:
        session.execute(update(User).where(User.id == user_id).values(**user_data.model_dump()))


def user_password_update(hash_pwd: str, user_id: int):
    with DBsession.begin() as session:
        session.execute(update(User).where(User.id == user_id).values(password=hash_pwd))


def user_avatar_update(url: str, user_id: int):
    with DBsession.begin() as session:
        session.execute(update(User).where(User.id == user_id).values(avatar=url))


#########################################################################################################################
################ Dictionary #############################################################################################
#########################################################################################################################
def add_user_dictionary_from_try(activity_try: LexisTryType):
    lexis = activity_try.base

    for card in lexis.cards:
        DBQS.add_user_dictionary_if_not_exists(card.dictionary_id, activity_try.user_id)
