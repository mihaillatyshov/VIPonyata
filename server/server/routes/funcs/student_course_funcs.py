import server.queries.StudentDBqueries as DBQS
from server.routes.routes_utils import GetCurrentUserId


def get_all_courses():
    return {"items": DBQS.get_available_courses(GetCurrentUserId())}
