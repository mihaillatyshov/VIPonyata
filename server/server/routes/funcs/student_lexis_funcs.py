from flask import request

import server.queries.StudentDBqueries as DBQS
from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.models.db_models import Drilling, Hieroglyph, LexisTryType, LexisType
from server.routes.funcs.additional_lexis_funcs import (LexisTaskName, LexisTaskNameList)
from server.routes.funcs.student_activity_funcs import ActivityFuncs
from server.routes.funcs.student_additional_lexis_funcs import (create_find_pair, create_scramble, create_space,
                                                                create_translate)
from server.routes.routes_utils import get_current_user_id


class LexisFuncs(ActivityFuncs[LexisType, LexisTryType]):
    _activityQueries: DBQS.LexisQueries[LexisType, LexisTryType]

    def add_new_done_tasks(self, activity_id: int):
        if not request.json:
            raise InvalidRequestJson()

        in_done_tasks = request.json.get("done_tasks", {})
        if not (in_done_tasks and isinstance(in_done_tasks, dict)):
            raise InvalidAPIUsage("Wrong data format", 403)

        lexis_try = self._activityQueries.GetUnfinishedTryByActivityId(activity_id, get_current_user_id())
        done_tasks = lexis_try.getDoneTasksDict()
        for name, value in in_done_tasks.items():
            try:
                value = int(value)
            except ValueError:
                continue
            if isinstance(name, str) and name in LexisTaskNameList:
                done_tasks[name] = value
        done_tasks_str = ",".join([f"{name}: {value}" for name, value in done_tasks.items()])
        self._activityQueries.set_done_tasks_in_try(lexis_try.id, done_tasks_str)
        return {"message": "Tasks updated!"}

    def GetById(self, activityId: int):
        lexis = self._activityQueries.GetById(activityId, get_current_user_id())
        lexis.now_try = self._activityQueries.GetUnfinishedTryByActivityId(activityId, get_current_user_id())

        tasks: dict = {}
        tasks[LexisTaskName.CARD] = lexis.cards
        if not tasks[LexisTaskName.CARD]:
            raise InvalidAPIUsage("No cards in lexis", 403)

        words_ru, words_jp, chars_jp = lexis.get_card_words()
        tasks_names = lexis.getTasksNames()

        if LexisTaskName.FINDPAIR in tasks_names:
            tasks[LexisTaskName.FINDPAIR] = create_find_pair(words_ru, words_jp, chars_jp)

        if LexisTaskName.SCRAMBLE in tasks_names:
            tasks[LexisTaskName.SCRAMBLE] = create_scramble(words_ru, words_jp, chars_jp)

        if LexisTaskName.TRANSLATE in tasks_names:
            tasks[LexisTaskName.TRANSLATE] = create_translate(words_ru, words_jp, chars_jp)

        if LexisTaskName.SPACE in tasks_names:
            tasks[LexisTaskName.SPACE] = create_space(
                words_ru, words_jp, chars_jp, self._activityQueries._activity_type)

        return {self._activityName: lexis, "items": tasks}


DrillingFuncs = LexisFuncs(Drilling)
HieroglyphFuncs = LexisFuncs(Hieroglyph)
