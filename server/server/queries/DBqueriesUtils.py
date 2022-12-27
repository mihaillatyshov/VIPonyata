from .. import DB


def GetSingleItem(DBRes):
    return DBRes[0] if DBRes else {}
