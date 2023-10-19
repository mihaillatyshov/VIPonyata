import threading
from datetime import datetime, timedelta

from flask_login import current_user

import server.queries.OtherDBqueries as DBQO
from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.load_config import load_config
from server.log_lib import LogI
from server.models.db_models import (ActivityTryType, ActivityType, Assessment,
                                     AssessmentTry, Drilling, DrillingTry,
                                     FinalBoss, FinalBossTry, Hieroglyph,
                                     HieroglyphTry, time_limit_to_timedelta)


def get_current_user_id() -> int:
    return current_user.GetId()


def get_current_user_is_teacher() -> bool:
    return current_user.IsTeacher()


def get_current_user_is_student() -> bool:
    return current_user.IsStudent()


def user_selector_function(teacher_func=None, student_func=None, *args, **kwargs) -> dict | tuple:
    if get_current_user_is_teacher():
        if not teacher_func:
            raise InvalidAPIUsage("You are not student!", 403)
        return teacher_func(*args, **kwargs)
    if get_current_user_is_student():
        if not student_func:
            raise InvalidAPIUsage("You are not teacher!", 403)
        return student_func(*args, **kwargs)

    raise InvalidAPIUsage("User level error!", 400)


#########################################################################################################################
################ Activity Timer #########################################################################################
#########################################################################################################################
def activity_end_time_handler(activity_try_id: int, activity_try_type: type[ActivityTryType]):
    activity_try = DBQO.get_activity_try_by_id(activity_try_id, activity_try_type)
    if (activity_try and not activity_try.end_datetime):
        LogI("========= Not Hand ===============================")
        DBQO.update_activity_try_end_time(activity_try_id, datetime.now(), activity_try_type)
    LogI("========= Timer End ===============================")


def start_activity_timer_limit(
        timedelta_remaining: timedelta, activity_try_id: int, activity_try_type: type[ActivityTryType]):
    seconds_remaining = int(timedelta_remaining.total_seconds())
    LogI("seconds remaining", seconds_remaining)
    threading.Timer(max(seconds_remaining, 1), activity_end_time_handler,
                    args=(activity_try_id, activity_try_type)).start()


def on_restart_server_check_tasks_timers_by_type(
        activity_type: type[ActivityType],
        activity_try_type: type[ActivityTryType]):
    LogI(f"on_restart_server_check_tasks_timers ==== START ==== {activity_type.__name__}")
    activity_tries = DBQO.get_activity_check_tasks_timers(activity_type, activity_try_type)
    LogI("on_restart_server_check_tasks_timers:", activity_tries)
    for activity, activity_try in activity_tries:

        if activity.time_limit is None:
            continue
        time_remaining = (
            activity_try.start_datetime + time_limit_to_timedelta(activity.time_limit)) - datetime.now()
        LogI("on_restart_server_check_tasks_timers:", time_remaining)
        start_activity_timer_limit(time_remaining, activity_try.id, activity_try_type)
    LogI(f"on_restart_server_check_tasks_timers ==== END ==== {activity_type.__name__}")


def on_restart_server_check_tasks_timers():
    on_restart_server_check_tasks_timers_by_type(Drilling, DrillingTry)
    on_restart_server_check_tasks_timers_by_type(Hieroglyph, HieroglyphTry)
    on_restart_server_check_tasks_timers_by_type(Assessment, AssessmentTry)
    on_restart_server_check_tasks_timers_by_type(FinalBoss, FinalBossTry)
