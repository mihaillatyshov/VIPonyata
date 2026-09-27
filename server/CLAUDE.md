# Server (Flask API)

Все команды — из папки `server/`. Подробная документация: [docs/server/architecture.md](../docs/server/architecture.md), известные проблемы: [docs/server/improvements.md](../docs/server/improvements.md).

## Команды

- Запуск dev: `python main.py` (Flask на `0.0.0.0:5000`) или `make dev` (сначала `alembic upgrade head`).
- Миграции: `alembic revision --autogenerate -m "<name>"`, затем **проверить сгенерированный файл руками**; применить `alembic upgrade head`.
- Юнит-тесты автопроверки заданий (без БД, unittest): `python -m unittest tests.assessment.TestSingleTest` — по модулю; все сразу см. [docs/development.md](../docs/development.md#тесты). `make test` / `tests.sh` сейчас не работают (неверный путь, нет `__init__.py`).
- Интеграционные тесты `tests/user` — pytest + pytest-mock (не в requirements.txt), нужен `config_test.json` с отдельной MySQL-БД: `python -m pytest tests/user`.
- Типы: `mypy server` (конфиг `mypy.ini`).

## Слои (сверху вниз)

1. `server/routes/routes.py`, `auth_routes.py` — только URL + `@login_required` + `user_selector_function(teacher_handler, student_handler, **kwargs)`, который выбирает хендлер по роли. `None` в позиции роли = 403 для этой роли.
2. `server/handlers/{teacher,student,common}/` — бизнес-логика, разбор `request.json` через `validate_req(PydanticModel, request.json)`.
3. `server/queries/{Teacher,Student,Other,Review}DBqueries.py` — доступ к БД; каждая функция открывает свою сессию `with DBsession.begin() as session:`.
4. `server/models/db_models.py` — ORM-модели (одним файлом), `server/models/*.py` — Pydantic-модели запросов.

## Правила

- Ошибки для клиента — `raise InvalidAPIUsage("Сообщение на русском", status_code)` (`server/exceptions/ApiExceptions.py`). Ответ: `{"message": ..., **payload}`.
- Входные данные всегда валидировать через `validate_req`, а не `Model(**request.json)` (иначе `ValidationError` → 500).
- Проверять доступ ученика к ресурсу (join через `users_courses`/`users_lessons` или `student_id == current user`), учитель видит всё.
- Сериализация ORM-объектов: метод `__json__()` у модели или автоматически все колонки (`NewCustomJSONEncoder` в `server/common.py`). Не отдавать ученику ответы заданий — для assessment используется `student_dict()`.
- Сессии создаются с `expire_on_commit=False`: объекты доступны после закрытия сессии, но ленивые relationship — нет. Нужные связи грузить явно (`selectinload`/`joinedload`).
- Новый тип активности должен быть зарегистрирован в `server/activities.py` (при старте проверяется наличие роутов).
- Логи: `LogI/LogW/LogE` из `server/log_lib.py` (print в stdout) и стандартный `logging`.
