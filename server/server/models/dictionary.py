from pydantic import BaseModel, model_validator

from server.models.utils import StrExtraSpaceRemove


class DictionaryCreateReqItem(BaseModel):
    ru: StrExtraSpaceRemove
    word_jp: StrExtraSpaceRemove | None = None
    char_jp: StrExtraSpaceRemove | None = None

    @model_validator(mode="after")
    def jp_validation(self) -> "DictionaryCreateReqItem":
        if self.word_jp is None and self.char_jp is None:
            raise ValueError(f"Две колонки с японским переводом не могут быть пустыми! ({self.ru})")

        return self


class DictionaryCreateReq(BaseModel):
    items: list[DictionaryCreateReqItem]

    @model_validator(mode="after")
    def items_validation(self) -> "DictionaryCreateReq":
        if len(self.items) < 2:
            raise ValueError(f"В уроке должно быть больше одного слова ({len(self.items)})")

        return self


class DictionaryImgReq(BaseModel):
    dictionary_id: int
    url: StrExtraSpaceRemove


class DictionaryAssosiationReq(BaseModel):
    dictionary_id: int
    assosiation: StrExtraSpaceRemove | None = None
