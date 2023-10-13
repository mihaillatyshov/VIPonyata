import server.queries.TeacherDBqueries as DBQT


def _get_notifications_try(activity_try_id: int, activity_try_type: str):
    if activity_try_type == "drilling_try":
        return DBQT.DrillingQueries.get_try_by_id(activity_try_id)
    if activity_try_type == "hieroglyph_try":
        return DBQT.HieroglyphQueries.get_try_by_id(activity_try_id)
    if activity_try_type == "assessment_try":
        return DBQT.AssessmentQueries.get_try_by_id(activity_try_id)
    if activity_try_type == "final_boss_try":
        return DBQT.FinalBossQueries.get_try_by_id(activity_try_id)

    return None


def _get_notifications_activity(activity_id: int, activity_try_type: str):
    if activity_try_type == "drilling_try":
        return DBQT.DrillingQueries.GetById(activity_id)
    if activity_try_type == "hieroglyph_try":
        return DBQT.HieroglyphQueries.GetById(activity_id)
    if activity_try_type == "assessment_try":
        return DBQT.AssessmentQueries.GetById(activity_id)
    if activity_try_type == "final_boss_try":
        return DBQT.FinalBossQueries.GetById(activity_id)

    return None


def _get_notifications_user(activity_try_id: int, activity_try_type: str):
    if activity_try_type == "drilling_try":
        return DBQT.DrillingQueries.get_user_by_try_id(activity_try_id)
    if activity_try_type == "hieroglyph_try":
        return DBQT.HieroglyphQueries.get_user_by_try_id(activity_try_id)
    if activity_try_type == "assessment_try":
        return DBQT.AssessmentQueries.get_user_by_try_id(activity_try_id)
    if activity_try_type == "final_boss_try":
        return DBQT.FinalBossQueries.get_user_by_try_id(activity_try_id)

    return None


def get_notifications():
    result = []
    notifications = DBQT.get_notifications()
    for notification in notifications:
        item_data = notification.__json__()
        print
        if item_data["type"] is not None:
            activity_try_data = _get_notifications_try(item_data["activity_try_id"], item_data["type"]).__json__()
            activity_data = _get_notifications_activity(activity_try_data["base_id"], item_data["type"]).__json__()
            lesson_data = DBQT.get_lesson_by_id(activity_data["lesson_id"]).__json__()
            user_data = _get_notifications_user(item_data["activity_try_id"], item_data["type"]).__json__()

            item_data["activity_try"] = activity_try_data
            item_data["activity"] = activity_data
            item_data["lesson"] = lesson_data
            item_data["user"] = user_data

        result.append(item_data)

    print(result)
    return {"notifications": result}
