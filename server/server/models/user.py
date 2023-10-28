import datetime

from pydantic import BaseModel, field_validator, model_validator
from server.exceptions.ApiExceptions import InvalidAPIUsage

from server.models.utils import StrExtraSpaceRemove


class UserRegisterReq(BaseModel):
    name: StrExtraSpaceRemove
    nickname: StrExtraSpaceRemove
    password1: str
    password2: str
    birthday: datetime.date

    @field_validator("birthday", mode="before")
    @classmethod
    def options_validation(cls, v: str):
        return datetime.datetime.strptime(v, '%Y-%m-%d').date()

    @model_validator(mode="after")
    def validate_on_create(self) -> "UserRegisterReq":
        if len(self.password1) <= 4:
            raise InvalidAPIUsage("Пароль должен быть длиннее 4 символов!!!")
        if self.password1 != self.password2:
            raise InvalidAPIUsage("Пароли не совпадают!!!")

        return self


class UserLoginReq(BaseModel):
    nickname: StrExtraSpaceRemove
    password: str


class ShareUserReq(BaseModel):
    user_id: int
