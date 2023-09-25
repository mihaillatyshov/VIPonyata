import datetime

from pydantic import BaseModel, validator


class LexisCreateReq(BaseModel):
    tasks: str
    description: str | None = None
    time_limit: datetime.time | None = None

    @validator("time_limit", always=True, pre=True)
    def options_validation(cls, v):
        if v is None:
            return None
        return datetime.datetime.strptime(v, '%H:%M:%S').time()


class LexisCardCreateReqItem(BaseModel):
    sentence: str
    answer: str
    dictionary_id: int
    
class LexisCardCreateReq(BaseModel):
    