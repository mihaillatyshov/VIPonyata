import re

my_str = "test some   spaces  here        !!!"

_RE_COMBINE_WHITESPACE = re.compile(r"\s+")

my_str = _RE_COMBINE_WHITESPACE.sub(" ", my_str).strip()

print(my_str)