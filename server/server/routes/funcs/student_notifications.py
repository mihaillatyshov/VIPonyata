import server.queries.StudentDBqueries as DBQS
from server.routes.routes_utils import GetCurrentUserId


def get_notifications():
    return {"notifications": DBQS.get_notifications(GetCurrentUserId())}