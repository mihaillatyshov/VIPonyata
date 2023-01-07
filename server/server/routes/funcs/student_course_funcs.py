from ...queries import StudentDBqueries as DBQS
from ..routes_utils import GetCurrentUserId


def getAllCourses():
    return {"items": DBQS.GetAvailableCourses(GetCurrentUserId())}
