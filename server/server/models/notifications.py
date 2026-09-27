from datetime import datetime

from pydantic import BaseModel, Field, field_validator

NOTIFICATIONS_PAGE_MAX_LIMIT = 100

_CURSOR_DATETIME_FORMAT = "%Y%m%d%H%M%S%f"


class NotificationsMarkAsReadReq(BaseModel):
    notification_ids: list[int]


class PageCursor(BaseModel):
    """Позиция в ленте, отсортированной по убыванию (datetime, rank, id).

    rank различает источники с одинаковым временем (история учителя собирается из нескольких таблиц),
    для ленты уведомлений он всегда 0.
    """
    sort_datetime: datetime
    rank: int = 0
    id: int

    def encode(self) -> str:
        return f"{self.sort_datetime.strftime(_CURSOR_DATETIME_FORMAT)}-{self.rank}-{self.id}"

    @classmethod
    def decode(cls, value: str) -> "PageCursor":
        parts = value.split("-")
        if len(parts) != 3:
            raise ValueError("Неверный курсор")

        return cls(sort_datetime=datetime.strptime(parts[0], _CURSOR_DATETIME_FORMAT),
                   rank=int(parts[1]),
                   id=int(parts[2]))

    def key(self) -> tuple[datetime, int, int]:
        return (self.sort_datetime, self.rank, self.id)


class NotificationsPageReq(BaseModel):
    """Параметры страницы. Без limit возвращается весь список (старое поведение)."""
    limit: int | None = Field(default=None, ge=1, le=NOTIFICATIONS_PAGE_MAX_LIMIT)
    cursor: PageCursor | None = None

    @field_validator("cursor", mode="before")
    @classmethod
    def parse_cursor(cls, value):
        if value is None or isinstance(value, PageCursor):
            return value
        if isinstance(value, str):
            if value == "":
                return None
            return PageCursor.decode(value)
        raise ValueError("Неверный курсор")


class HistoryPageReq(NotificationsPageReq):
    student_id: int | None = None
