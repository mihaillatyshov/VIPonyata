import server.queries.StudentDBqueries as DBQS
from server.routes.routes_utils import get_current_user_id


def get_notifications():
    return {"notifications": DBQS.get_notifications(get_current_user_id())}
