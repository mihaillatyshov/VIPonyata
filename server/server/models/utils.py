import re

from pydantic import AfterValidator
from typing_extensions import Annotated

_RE_COMBINE_WHITESPACE = re.compile(r"\s+")

StrExtraSpaceRemove = Annotated[str, AfterValidator(lambda x: _RE_COMBINE_WHITESPACE.sub(" ", x).strip())]
