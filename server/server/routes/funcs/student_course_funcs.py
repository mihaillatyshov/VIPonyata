import server.queries.StudentDBqueries as DBQS
from server.routes.routes_utils import GetCurrentUserId


def getAllCourses():
    return {"items": DBQS.GetAvailableCourses(GetCurrentUserId())}
