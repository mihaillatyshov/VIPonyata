from pydantic import BaseModel

from server.models.utils import StrExtraSpaceRemove


class ReviewDictionaryCreateReq(BaseModel):
    title: StrExtraSpaceRemove
    sort: int = 500


class ReviewTopicCreateReq(BaseModel):
    dictionary_id: int | None = None
    title: StrExtraSpaceRemove
    sort: int = 500


class ReviewWordCreateReq(BaseModel):
    topic_id: int
    source: StrExtraSpaceRemove | None = None
    word_jp: StrExtraSpaceRemove
    ru: StrExtraSpaceRemove
    note: str | None = None
    examples: str | None = None


class ReviewWordUpdateReq(BaseModel):
    source: StrExtraSpaceRemove | None = None
    word_jp: StrExtraSpaceRemove
    ru: StrExtraSpaceRemove
    note: str | None = None
    examples: str | None = None
