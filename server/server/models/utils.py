import re
from typing import Type, TypeVar

from pydantic import AfterValidator, BaseModel, ValidationError
from pydantic_core import ErrorDetails
from typing_extensions import Annotated

from server.exceptions.ApiExceptions import InvalidAPIUsage, InvalidRequestJson

_RE_COMBINE_WHITESPACE = re.compile(r"\s+")

StrExtraSpaceRemove = Annotated[str, AfterValidator(lambda x: _RE_COMBINE_WHITESPACE.sub(" ", x).strip())]
StrStrip = Annotated[str, AfterValidator(lambda x: x.strip())]

T = TypeVar("T", bound=BaseModel)


def format_errors(pydantic_errors: list[ErrorDetails]) -> tuple[dict, str | None]:
    result: dict = {"errors": {}}
    message: str | None = None

    for error in pydantic_errors:
        if len(error["loc"]) > 0:
            result["errors"][error["loc"][0]] = {"message": error["msg"], "type": error["type"]}
        else:
            message = error["msg"]

    return result, message


def validate_req(req_type: Type[T],
                 req_data: dict | None,
                 validation_code: int = 400,
                 validation_message: str = "",
                 value_code: int = 400,
                 value_message: str = "",
                 other_data: dict = {}) -> T:
    if not req_data:
        raise InvalidRequestJson()

    try:
        return req_type(**req_data, **other_data)
    except ValidationError as e:
        parsed_errors, message = format_errors(e.errors())
        raise InvalidAPIUsage(message if message is not None else validation_message, validation_code, parsed_errors)
    except ValueError as e:
        raise InvalidAPIUsage(value_message, value_code)
