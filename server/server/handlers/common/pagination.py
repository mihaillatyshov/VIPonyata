from typing import Any, Callable, Sequence, TypeVar

from server.models.notifications import PageCursor

RowT = TypeVar("RowT")

# Сколько раз дочитывать страницу, если часть строк отброшена при сборке (например, удалённые связанные данные).
_MAX_FETCH_ROUNDS = 5


def paginate_by_cursor(fetch: Callable[[PageCursor | None, int], Sequence[RowT]],
                       get_cursor: Callable[[RowT], PageCursor], build: Callable[[Sequence[RowT]],
                                                                                 list[dict[str, Any]]], limit: int,
                       cursor: PageCursor | None) -> tuple[list[dict[str, Any]], str | None]:
    """Собирает страницу из `limit` элементов и возвращает (элементы, курсор следующей страницы или None).

    `fetch(cursor, n)` — первые n строк после курсора по убыванию; `build(rows)` — готовые элементы
    (может отбросить часть строк). Лишняя строка запрашивается, чтобы понять, есть ли продолжение.
    """
    items: list[dict[str, Any]] = []
    for _ in range(_MAX_FETCH_ROUNDS):
        need = limit - len(items)
        rows = fetch(cursor, need + 1)
        has_more = len(rows) > need
        rows = rows[:need]
        items.extend(build(rows))

        if not has_more:
            return items, None

        cursor = get_cursor(rows[-1])
        if len(items) >= limit:
            break

    return items, cursor.encode() if cursor is not None else None


def notification_cursor(notification) -> PageCursor:
    return PageCursor(sort_datetime=notification.creation_datetime, id=notification.id)
