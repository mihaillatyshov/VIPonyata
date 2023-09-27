from typing_extensions import Annotated
import re

from pydantic import Field, AfterValidator

_RE_COMBINE_WHITESPACE = re.compile(r"\s+")
Username = Annotated[str, AfterValidator(lambda x: _RE_COMBINE_WHITESPACE.sub(" ", x).strip()), Field(min_length=3)]

from pydantic import TypeAdapter, ValidationError

ta = TypeAdapter(Username)

print(ta.validate_python('adr    iangb' + ' ' * 100))
try:
    ta.validate_python('a' * 100 + ' ' * 10)
except ValidationError as exc:
    print(exc)
except Exception as e:
    print(e)
else:
    assert False