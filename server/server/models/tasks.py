import json

from pydantic import BaseModel, model_validator

from server.models.assessment import BaseModelTaskReq
from server.models.utils import StrExtraSpaceRemove


class TaskBankItemCreateReq(BaseModel):
    title: StrExtraSpaceRemove
    task: BaseModelTaskReq
    lesson_id: int | None = None
    sort: int = 500


class TaskBankItemUpdateReq(TaskBankItemCreateReq):
    pass


class HomeworkAssignmentDraftTaskReq(BaseModel):
    title: StrExtraSpaceRemove
    task: BaseModelTaskReq
    lesson_id: int | None = None
    task_bank_item_id: int | None = None
    sort: int = 0


class HomeworkAssignmentCreateReq(BaseModel):
    title: StrExtraSpaceRemove
    student_ids: list[int]
    tasks: list[HomeworkAssignmentDraftTaskReq]

    @model_validator(mode="after")
    def validate_payload(self) -> "HomeworkAssignmentCreateReq":
        if len(set(self.student_ids)) == 0:
            raise ValueError("At least one student must be selected")
        if len(self.tasks) == 0:
            raise ValueError("At least one task must be selected")
        return self


class HomeworkAssignmentSaveReq(BaseModel):
    done_tasks: list[dict]


class HomeworkTaskBankBulkCreateReq(BaseModel):
    items: list[TaskBankItemCreateReq]

    @model_validator(mode="after")
    def validate_payload(self) -> "HomeworkTaskBankBulkCreateReq":
        if len(self.items) == 0:
            raise ValueError("At least one item must be provided")
        return self


class HomeworkAssignmentTaskPreview(BaseModel):
    id: int | None = None
    task_bank_item_id: int | None = None
    title: str
    lesson_id: int | None = None
    sort: int = 0
    task: dict

    def dump_task_json(self) -> str:
        return json.dumps(self.task, ensure_ascii=False)
