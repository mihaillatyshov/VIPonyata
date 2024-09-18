from pydantic import BaseModel


class NotificationsMarkAsReadReq(BaseModel):
    notification_ids: list[int]
