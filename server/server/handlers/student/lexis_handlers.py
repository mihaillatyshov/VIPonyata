from typing import Generic

from flask import request

import server.queries.StudentDBqueries as DBQS
from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.handlers.common.additional_lexis_handlers import (
    LexisTaskName, LexisTaskNameList)
from server.handlers.student.activity_handlers import ActivityHandlers
from server.handlers.student.additional_lexis_handlers import (
    create_find_pair, create_scramble, create_space, create_translate)
from server.handlers.student.dictionary_handlers import combine_dictionary
from server.models.db_models import (Drilling, DrillingCard, DrillingTry,
                                     Hieroglyph, HieroglyphCard, HieroglyphTry,
                                     LexisCardType, LexisTryType, LexisType,
                                     time_limit_to_timedelta)
from server.routes.routes_utils import (activity_end_time_handler,
                                        get_current_user_id,
                                        start_activity_timer_limit)


class LexisHandlers(ActivityHandlers[LexisType, LexisTryType], Generic[LexisType, LexisTryType, LexisCardType]):
    _activity_queries: DBQS.LexisQueries[LexisType, LexisTryType, LexisCardType]

    def start_new_try(self, activity_id: int):
        activity = self._activity_queries.get_by_id(activity_id, get_current_user_id())
        activity_tries = self._activity_queries.get_tries_by_activity_id(activity_id, get_current_user_id())

        if activity_tries and activity_tries[-1].end_datetime == None:
            return {"message": "Lexis try already Exists"}, 409

        new_activity_try = self._activity_queries.add_new_try(
            len(activity_tries) + 1, activity_id, get_current_user_id())

        if activity.time_limit and new_activity_try:
            start_activity_timer_limit(time_limit_to_timedelta(activity.time_limit), new_activity_try.id,
                                       self._activity_queries._activityTry_type)
        return {"message": "Lexis try successfully created"}

    def add_new_done_tasks(self, activity_id: int):
        if not request.json:
            raise InvalidRequestJson()

        in_done_tasks = request.json.get("done_tasks", {})
        if not (in_done_tasks and isinstance(in_done_tasks, dict)):
            raise InvalidAPIUsage("Wrong data format", 403)

        lexis_try = self._activity_queries.get_unfinished_try_by_activity_id(activity_id, get_current_user_id())
        done_tasks = lexis_try.get_done_tasks_dict()
        for name, value in in_done_tasks.items():
            try:
                value = int(value)
            except ValueError:
                continue
            if isinstance(name, str) and name in LexisTaskNameList:
                done_tasks[name] = value
        done_tasks_str = ",".join([f"{name}: {value}" for name, value in done_tasks.items()])
        self._activity_queries.set_done_tasks_in_try(lexis_try.id, done_tasks_str)
        return {"message": "Tasks updated!"}

    def end_try(self, activity_id: int):
        activity_try = self._activity_queries.get_unfinished_try_by_activity_id(activity_id, get_current_user_id())
        activity_end_time_handler(activity_try.id, self._activity_queries._activityTry_type)
        return {"message": "Successfully closed"}

    def get_by_id(self, activity_id: int):
        lexis = self._activity_queries.get_by_id(activity_id, get_current_user_id())
        lexis.now_try = self._activity_queries.get_unfinished_try_by_activity_id(activity_id, get_current_user_id())

        tasks: dict = {}
        tasks[LexisTaskName.CARD] = self._activity_queries.get_cards_by_activity_id(activity_id)
        words_ru: list[str] = []
        words_jp: list[str] = []
        chars_jp: list[str] = []
        for card in tasks[LexisTaskName.CARD]:
            DBQS.add_user_dictionary_if_not_exists(card.dictionary_id, get_current_user_id())
            dict_item, dict_user = DBQS.get_ditcionary_item(card.dictionary_id, get_current_user_id())

            card.word = combine_dictionary(dict_item, dict_user)
            words_ru.append(card.word["ru"])
            words_jp.append(card.word["word_jp"])
            chars_jp.append(card.word["char_jp"])

        if not tasks[LexisTaskName.CARD]:
            raise InvalidAPIUsage("No cards in lexis", 403)

        tasks_names = lexis.getTasksNames()

        if LexisTaskName.FINDPAIR in tasks_names:
            tasks[LexisTaskName.FINDPAIR] = create_find_pair(words_ru, words_jp, chars_jp)

        if LexisTaskName.SCRAMBLE in tasks_names:
            tasks[LexisTaskName.SCRAMBLE] = create_scramble(words_ru, words_jp, chars_jp)

        if LexisTaskName.TRANSLATE in tasks_names:
            tasks[LexisTaskName.TRANSLATE] = create_translate(words_ru, words_jp, chars_jp)

        if LexisTaskName.SPACE in tasks_names:
            tasks[LexisTaskName.SPACE] = create_space(
                words_ru, words_jp, chars_jp, self._activity_queries._activity_type)

        return {"lexis": lexis, "items": tasks}


DrillingHandlers = LexisHandlers[Drilling, DrillingTry, DrillingCard](Drilling)
HieroglyphHandlers = LexisHandlers[Hieroglyph, HieroglyphTry, HieroglyphCard](Hieroglyph)
