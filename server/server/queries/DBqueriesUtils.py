from .. import DBsession


def ObjectToDict(obj) -> dict:
    resDict = {}
    if obj:
        for column in obj.__table__.columns:
            resDict[column.name] = getattr(obj, column.name)
    return resDict


def ObjectListToDictList(objList) -> list:
    resList = []
    if objList:
        for obj in objList:
            resList.append(ObjectToDict(obj))
    return resList


def DecoratorObjectListToDictList(func):
    def wrapper(*args, **kwargs) -> list:
        return ObjectListToDictList(func(*args, **kwargs))
    return wrapper


def DecoratorObjectToDict(func):
    def wrapper(*args, **kwargs) -> dict:
        return ObjectToDict(func(*args, **kwargs))
    return wrapper
