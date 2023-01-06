from datetime import datetime

from ..DBlib import DoneDrilling, Drilling
from .DBqueriesUtils import *


def GetCheckTasksTimersDrillings() -> list:
    return DBsession.query(DoneDrilling).filter(
        DoneDrilling.end_datetime == None).join(
        DoneDrilling.drilling).filter(
        Drilling.time_limit != None).all()


def GetDoneDrillingById(doneDrillingId: int) -> DoneDrilling | None:
    return DBsession.query(DoneDrilling).filter_by(id=doneDrillingId).one_or_none()


def UpdateDoneDrillingEndTime(doneDrillingId: int, endTime: datetime) -> None:
    if doneDrilling := DBsession.query(DoneDrilling).filter_by(id=doneDrillingId).one_or_none():
        doneDrilling.end_datetime = endTime
        DBsession.add(doneDrilling)
        DBsession.commit()
