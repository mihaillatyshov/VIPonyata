import server.queries.StudentDBqueries as DBQS
from ..routes_utils import GetCurrentUserId


def getAllCourses():
    return {"items": DBQS.GetAvailableCourses(GetCurrentUserId())}
