import datetime

from pydantic import BaseModel, field_validator, model_validator

from server.exceptions.ApiExceptions import InvalidAPIUsage
from server.models.utils import StrExtraSpaceRemove


class UserDataBase(BaseModel):
    name: StrExtraSpaceRemove
    nickname: StrExtraSpaceRemove
    birthday: datetime.date

    @field_validator("birthday", mode="before")
    @classmethod
    def options_validation(cls, v: str):
        return datetime.datetime.strptime(v, '%Y-%m-%d').date()


class UserNewPasswordBase(BaseModel):
    password1: str
    password2: str

    @model_validator(mode="after")
    def validate_on_create(self) -> "UserNewPasswordBase":
        if len(self.password1) <= 4:
            raise InvalidAPIUsage("Пароль должен быть длиннее 4 символов!!!")
        if self.password1 != self.password2:
            raise InvalidAPIUsage("Пароли не совпадают!!!")

        return self


class UserRegisterReq(UserDataBase, UserNewPasswordBase):
    pass


class UserLoginReq(BaseModel):
    nickname: StrExtraSpaceRemove
    password: str


class UserDataUpdateReq(UserDataBase):
    pass


class UserPasswordUpdateReq(UserNewPasswordBase):
    pass


class UserAvatarUpdateReq(BaseModel):
    url: StrExtraSpaceRemove


class ShareUserReq(BaseModel):
    user_id: int
