import datetime

from pydantic import BaseModel, field_validator

from server.models.utils import StrExtraSpaceRemove


class LexisCreateReq(BaseModel):
    tasks: str
    description: str | None = None
    time_limit: datetime.time | None = None

    @field_validator("time_limit", mode="before")
    @classmethod
    def options_validation(cls, v):
        if v is None:
            return None
        return datetime.datetime.strptime(v, '%H:%M:%S').time()


class LexisCardCreateReqItem(BaseModel):
    sentence: StrExtraSpaceRemove
    answer: StrExtraSpaceRemove
    dictionary_id: int


class LexisCardCreateReq(BaseModel):
    cards: list[LexisCardCreateReqItem]

    @field_validator("cards")
    @classmethod
    def options_validation(cls, v: list[LexisCardCreateReqItem]):
        if len(v) < 1:
            raise ValueError(f"Мало вариантов выбора ({len(v)})")
        return v
