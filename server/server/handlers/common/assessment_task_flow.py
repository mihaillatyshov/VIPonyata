import json
import random

from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson
from server.handlers.common.assessment_auto_checks import CheckAliases
from server.log_lib import LogE, LogW
from server.models.assessment import Aliases, AssessmentTaskName


def shuffle_test_options_for_new_try(task: dict) -> dict:
    task_name = task.get("name")
    if task_name not in (AssessmentTaskName.TEST_SINGLE.value, AssessmentTaskName.TEST_MULTI.value):
        return task

    options = task.get("options")
    if not isinstance(options, list) or len(options) <= 1:
        return task

    index_order = list(range(len(options)))
    random.shuffle(index_order)
    old_to_new_index = {old_index: new_index for new_index, old_index in enumerate(index_order)}
    task["options"] = [options[old_index] for old_index in index_order]

    if task_name == AssessmentTaskName.TEST_SINGLE.value:
        meta_answer = task.get("meta_answer")
        if isinstance(meta_answer, int):
            task["meta_answer"] = old_to_new_index[meta_answer]
        return task

    meta_answers = task.get("meta_answers")
    if isinstance(meta_answers, list):
        task["meta_answers"] = [old_to_new_index[answer] for answer in meta_answers]

    return task


def parse_new_tasks(data_str: str) -> list[dict]:
    data = json.loads(data_str)

    tasks = []
    for task in data:
        if handler := Aliases.get(task["name"]):
            task_base = handler["create"](**task)
            task_new = handler["res"](**task_base.model_dump())
            tasks.append(shuffle_test_options_for_new_try(task_new.model_dump()))
        else:
            LogW("No parser for this task!", task["name"])
    return tasks


def parse_student_tasks(data_str: str) -> list[dict]:
    data = json.loads(data_str)

    tasks = []
    for task in data:
        if handler := Aliases.get(task["name"]):
            task_db = handler["res"](**task)
            tasks.append(task_db.student_dict())
        else:
            LogW("No parser for this task!", task["name"])
    return tasks


def parse_student_req(req_data: list[dict], db_data: list[dict]) -> list[dict]:
    tasks: list[dict] = []

    if not isinstance(req_data, list) or len(req_data) != len(db_data):
        raise InvalidRequestJson()

    for req, db in zip(req_data, db_data):
        if req.get("name") is None:
            raise InvalidRequestJson()

        if handler := Aliases.get(req["name"]):
            req_handler = handler["req"](**req)
            db_handler = handler["res"](**db)
            res_handler = handler["res"](**(db_handler.combine_dict() | req_handler.combine_dict()))
            if not res_handler.custom_validation():
                LogE(req, "\n", db)
                LogW(req_handler)
                LogW(db_handler)
                LogW(res_handler)
                raise InvalidAPIUsage(f"Currupted task {req['name']}")
            tasks.append(res_handler.model_dump())
        else:
            raise InvalidAPIUsage(f"Wrong name alias {req['name']}")

    return tasks


def check_task_req(tasks: list[dict]) -> list[dict]:
    checks: list[dict] = []
    for task in tasks:
        handler = Aliases.get(task["name"])
        check_handler = CheckAliases.get(task["name"])
        if handler is None or check_handler is None:
            raise InvalidAPIUsage(f"Currupted task {task['name']}")

        res_task = handler["res"](**task)
        checks.append(check_handler(res_task).model_dump())

    return checks


def create_blocks(done_tasks_list: list[dict] | None, checked_tasks: list[dict] | None):
    if checked_tasks is None or done_tasks_list is None:
        return []

    blocks: list[list[dict]] = []
    is_item_in_last_block = False

    for i, (done_task_item, check_task_item) in enumerate(zip(done_tasks_list, checked_tasks)):
        if done_task_item.get("name") == AssessmentTaskName.BLOCK_BEGIN:
            is_item_in_last_block = True
            blocks.append([])
        elif done_task_item.get("name") == AssessmentTaskName.BLOCK_END:
            is_item_in_last_block = False
            blocks[-1].append({"item": check_task_item, "itemId": i})
            continue

        if is_item_in_last_block:
            blocks[-1].append({"item": check_task_item, "itemId": i})
        else:
            blocks.append([{"item": check_task_item, "itemId": i}])

    return blocks
