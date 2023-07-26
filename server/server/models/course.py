from pydantic import BaseModel, root_validator, validator


class CourseCreateReq(BaseModel):
    name: str
    difficulty: str
    difficulty_color: str | None = None
    sort: int = 500
    description: str | None = None
    img: str | None = None