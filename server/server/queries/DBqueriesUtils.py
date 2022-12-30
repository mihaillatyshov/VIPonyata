from .. import DBsession
from ..DBlib import Course, DoneDrilling, Drilling, Lesson, User


def ObjectListToDictList(func):
    def wrapper(*args, **kwargs) -> list:
        res_list = []
        if DBResList := func(*args, **kwargs):
            for DBRes in DBResList:
                res_dict = {}
                for column in DBRes.__table__.columns:
                    res_dict[column.name] = str(getattr(DBRes, column.name))
                res_list.append(res_dict)
        return res_list
    return wrapper


def GetDictFromSingleItem(func):
    def wrapper(*args, **kwargs) -> dict:
        res_dict = {}
        if DBRes := func(*args, **kwargs):
            for column in DBRes.__table__.columns:
                res_dict[column.name] = str(getattr(DBRes, column.name))
        return res_dict
    return wrapper
