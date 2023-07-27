from pydantic import BaseModel


class LessonCreateReq(BaseModel):
    name: str
    number: int = 500
    description: str | None = None
    img: str | None = None