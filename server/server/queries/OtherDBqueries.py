from datetime import datetime

from .DBqueriesUtils import *


def GetCheckTasksTimersDrillings() -> list:
    return DB.GetTablesJson({
        "drillings":        {"elements": ["TimeLimit"]},
        "donedrillings":   {"elements": ["Id", "StartTime"]}},
        where=f"drillings.Id = donedrillings.DrillingId AND drillings.TimeLimit IS NOT NULL AND donedrillings.EndTime IS NULL")


def GetDoneDrillingById(doneDrillingId: int) -> dict:
    return GetSingleItem(DB.GetTableJson("donedrillings", where=f"Id='{doneDrillingId}'"))


def UpdateDoneDrillingEndTime(doneDrillingId: int, endTime: datetime) -> None:
    DB.UpdateTableElement("donedrillings", {"EndTime": endTime}, f"Id='{doneDrillingId}'")
