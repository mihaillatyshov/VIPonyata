import server.queries.StudentDBqueries as DBQS
from server.routes.routes_utils import get_current_user_id


def get_all_courses():
    return {"items": DBQS.get_available_courses(get_current_user_id())}
