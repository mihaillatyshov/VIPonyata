from typing_extensions import Annotated
from pydantic import BaseModel, Field, BeforeValidator

Username = Annotated[str, BeforeValidator(lambda x: str.strip(str(x))), Field(min_length=3, max_length=20)]


class MyModel(BaseModel):
    username: Username


mm = MyModel(username="  f  ")

print(mm)