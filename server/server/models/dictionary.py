from pydantic import BaseModel, root_validator


class DictionaryCreateReqItem(BaseModel):
    ru: str
    word_jp: str | None = None
    char_jp: str | None = None

    @root_validator(skip_on_failure=True)
    def jp_validation(cls, values: dict):
        if values["word_jp"] is None and values["char_jp"] is None:
            raise ValueError(f"Две колонки с японским переводом не могут быть пустыми! ({values['ru']})")

        return values


class DictionaryCreateReq(BaseModel):
    items: list[DictionaryCreateReqItem]

    @root_validator(skip_on_failure=True)
    def items_validation(cls, values: dict):
        if len(values["items"]) < 2:
            raise ValueError(f"В уроке должно быть больше одного слова ({len(values['items'])})")

        return values