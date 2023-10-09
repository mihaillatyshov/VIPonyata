import re
from typing import Type, TypeVar

from pydantic import AfterValidator, BaseModel, ValidationError
from typing_extensions import Annotated

from pydantic_core import ErrorDetails

from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson

_RE_COMBINE_WHITESPACE = re.compile(r"\s+")

StrExtraSpaceRemove = Annotated[str, AfterValidator(lambda x: _RE_COMBINE_WHITESPACE.sub(" ", x).strip())]

T = TypeVar("T", bound=BaseModel)


def foramt_errors(pydantic_errors: list[ErrorDetails]) -> dict:
    return {"errors": {error["loc"][0]: {"msg": error["msg"], "type": error["type"]} for error in pydantic_errors}}


def validate_req(req_type: Type[T],
                 data: dict | None,
                 validation_code: int = 400,
                 validation_message: str = "",
                 value_code: int = 400,
                 value_message: str = "") -> T:
    if not data:
        raise InvalidRequestJson()

    try:
        return req_type(**data)
    except ValidationError as e:
        print(e.errors())
        print(foramt_errors(e.errors()))
        raise InvalidAPIUsage(validation_message, validation_code, foramt_errors(e.errors()))
    except ValueError as e:
        raise InvalidAPIUsage(value_message, value_code)
