# Сервер: архитектура

## Структура `server/`

```
main.py                   точка входа: логирование, create_app(), CORS; app — WSGI-объект для gunicorn
config.json               конфиг (db, uploads, flask_secret, logs_folder); не в git
alembic.ini, migrations/  миграции
server/
  start_server.py         create_app(): сессия БД, триггеры, Flask, login_manager, blueprint, errorhandler, таймеры
  common.py               DBsession (фабрика сессий), триггеры, login_manager, base_blueprint (/api), JSON-провайдер
  activities.py           реестр типов активностей + проверка наличия роутов при старте
  load_config.py          чтение config.json (относительно cwd!)
  log_lib.py              LogI/LogW/LogE
  exceptions/ApiExceptions.py   InvalidAPIUsage и наследники
  routes/                 auth_routes.py (login/register/profile), routes.py (всё остальное), routes_utils.py
  handlers/
    teacher/              хендлеры учителя по фичам
    student/              хендлеры ученика по фичам
    common/               загрузка файлов, автопроверка assessment, генерация lexis-заданий
  queries/                TeacherDBqueries, StudentDBqueries, OtherDBqueries, ReviewDBqueries
  models/
    db_models.py          все ORM-модели (SQLAlchemy 2.0, Mapped[...])
    assessment.py         Pydantic-модели заданий assessment + Aliases (реестр типов)
    quizlet.py, tasks.py, review.py, user.py, course.py, lesson.py, lexis.py, dictionary.py  Pydantic-модели запросов
    FlaskUser.py          обёртка пользователя для Flask-Login
    utils.py              validate_req, StrStrip, StrExtraSpaceRemove
tests/                    assessment (unittest), user (pytest)
experiments/, sql_files/  черновики, в приложении не используются
```

## Поток запроса

```
routes.py  @routes_bp.route("/quizlet/groups", methods=["GET"]) + @login_required
   └─ user_selector_function(teacher_funcs.get_quizlet_groups, student_funcs.get_quizlet_catalog)
        └─ handlers/<role>/quizlet_handlers.py   validate_req(...), проверки, сборка ответа (dict)
             └─ queries/*DBqueries.py            with DBsession.begin() as session: select(...)
```

- Хендлер возвращает `dict` (Flask сериализует через `NewCustomJSONEncoder`) или `(dict, status)`.
- ORM-объект в ответе сериализуется через его `__json__()` либо «все колонки»; `datetime/time/timedelta` → `str()`.
- Ошибки: `raise InvalidAPIUsage(message, status, payload)` в любом слое → `{"message": ..., **payload}` с кодом. Ошибки валидации Pydantic через `validate_req` → `{"message", "errors": {field: {message, type}}}`.
- Текущий пользователь: `get_current_user_id()`, `get_current_user_is_teacher()` (`routes/routes_utils.py`). `FlaskUser` загружается из БД на каждый запрос по `nickname` (идентификатор сессии — nickname).

## Активности (generic-классы)

Lexis и assessment реализованы обобщёнными классами, параметризованными ORM-типами:

- `queries/StudentDBqueries.py`: `ActivityQueries[Activity, Try]` → `LexisQueries[..., Card]`, `AssessmentQueriesClass`.
- `handlers/student/activity_handlers.py`: `ActivityHandlers` → `LexisHandlers` (`DrillingHandlers = LexisHandlers[Drilling, DrillingTry, DrillingCard](Drilling)`), `AssessmentHandlers`, `FinalBossHandlers`.
- Аналогично в `handlers/teacher/`.
- Роуты для каждого типа прописаны в `routes.py` вручную; `activities.py` при старте проверяет, что для каждого зарегистрированного типа есть весь набор роутов (`newtry`, `continuetry`, `endtry`, `newdonetask(s)`, `GET`, `POST`).

## Как добавить эндпоинт

1. Pydantic-модель запроса в `server/models/<feature>.py` (строки — `StrStrip`/`StrExtraSpaceRemove`).
2. Функция запроса к БД в `queries/TeacherDBqueries.py` или `StudentDBqueries.py`. Сессия `with DBsession.begin() as session:`; связи, нужные в ответе, грузить `selectinload`.
3. Хендлер в `handlers/<role>/<feature>_handlers.py`: `data = validate_req(Model, request.json)`, проверка доступа, вызов query, `return {...}`. Экспортировать через `handlers/<role>/__init__.py` (там `import *`).
4. Роут в `routes/routes.py` в нужной секции: `@login_required` + `user_selector_function(teacher_fn | None, student_fn | None, **path_params)`.
5. Тип ответа в `client/src/models/T<Feature>.ts`.

## Как добавить тип задания assessment

1. `server/models/assessment.py`: значение в `AssessmentTaskName`, классы `...TaskBase/TeacherReq/Res/StudentReq` по образцу существующих, регистрация в `Aliases`.
2. Автопроверка в `handlers/common/assessment_auto_checks.py` (`CheckAliases`).
3. Тест в `tests/assessment/Test<Name>.py`.
4. Клиент: тип в `client/src/models/Activity/Items/TAssessmentItems.ts`, редактор учителя в `components/Activities/Assessment/ProcessingPage/Types/`, компонент ученика в `components/Activities/Assessment/Types/`, превью, просмотр попытки.

## База данных

- Все модели — `server/models/db_models.py`. Строковые поля ограничены `String(N)`; сложные структуры (задания, прогресс, очереди) хранятся JSON-строкой в `Text` с методами-хелперами (`get_tasks_names()`, `get_subgroup_ids()` и т.п.).
- `sessionmaker(expire_on_commit=False)`: возвращаемые из query-функций объекты «отсоединены» — можно читать загруженные атрибуты, ленивые relationship вызовут `DetachedInstanceError`.
- Пул: `pool_size=20, max_overflow=30, pool_recycle=3600, pool_pre_ping=True` (`create_db_engine`).
