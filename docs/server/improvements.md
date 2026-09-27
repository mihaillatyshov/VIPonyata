# Сервер: узкие места и план улучшений

Результат ревью (сентябрь 2026). Приоритет: 🔴 высокий, 🟠 средний, 🟢 низкий. После исправления пункта удаляй его или помечай «сделано».

## Безопасность и корректность

1. 🔴 **Идентификатор сессии — `nickname`, а nickname можно менять.** `FlaskUser.get_id()` возвращает `nickname`, `load_user` ищет по нему (`server/models/FlaskUser.py`, `routes/auth_routes.py`). `PATCH /api/profile/data` меняет nickname (`OtherDBqueries.user_data_update`) без проверки уникальности. Последствия: после смены ника пользователь разлогинивается; занятый ник → IntegrityError → 500; старая remember-cookie (год жизни) начнёт авторизовывать **другого** человека, который позже зарегистрирует освободившийся ник.
   → Использовать `id` (или отдельный `session_token`, сбрасываемый при смене пароля) в `get_id()`; проверять уникальность ника при обновлении.
2. 🔴 **Смена пароля не инвалидирует сессии** (remember-cookie продолжает работать). → Токен/версия сессии в таблице `users`, проверка в `user_loader`.
3. 🔴 **Загрузка файлов** (`handlers/common/upload_files.py`):
   - имя файла = sha512 от текущего времени с точностью до секунды: две загрузки в одну секунду дают коллизию, и `while True` крутится вхолостую (busy-loop) до смены секунды, блокируя воркер; имена предсказуемы. → `uuid4()`/`secrets.token_hex()`.
   - нет лимита размера (`MAX_CONTENT_LENGTH`), Pillow без ограничения на размер изображения (decompression bomb), mp3 сохраняется без проверки содержимого, расширение проверяется только по имени.
   - `request.files["file"]` при другом имени поля → KeyError → 500.
4. 🟠 **Нет защиты от перебора паролей** на `/api/login`. → rate limit (Flask-Limiter или nginx `limit_req`).
5. 🟠 **`CORS(app)` для всех источников** (`main.py`) — не нужен, клиент и API на одном домене. Cookie-флаги (`SESSION_COOKIE_SECURE`, `SESSION_COOKIE_SAMESITE`, `REMEMBER_COOKIE_*`, срок remember) не заданы.
6. 🟠 **Необработанные ошибки валидации → 500.** Часть хендлеров создаёт Pydantic-модель напрямую: `CourseCreateReq(**request.json)` (`handlers/teacher/course_handlers.py`) и др. (в уведомлениях исправлено) → везде `validate_req`.
7. 🟠 **Гонки check-then-insert.** Например `LexisHandlers.start_new_try`: читает попытки, потом вставляет новую в другой транзакции; от дублей спасают только триггеры БД (ответ — 500 вместо 409). То же в назначениях/сессиях quizlet.
8. 🟢 Неверные HTTP-коды: `InvalidAPIUsage("Wrong data format", 403)`, `"No cards in lexis", 403` — должно быть 400/422/404.

## Производительность

9. ✅ **Сделано:** уведомления и история учителя — курсорная пагинация (`limit` + `cursor`, `models/notifications.py:PageCursor`), связанные данные страницы грузятся пачкой (`queries/NotificationsDBqueries.py`), счётчик — `GET /api/notifications/unread_count`, счётчики по ученикам для истории — агрегатами (`/notifications/history/students`). Схема — в [../architecture.md](../architecture.md#уведомления). На локальной копии БД: история целиком 1.3 с → 0.15 с, страница из 20 — ~10 мс; уведомления учителя 0.75 с → страница ~5 мс. Без `limit` эндпоинты отдают весь список в старом формате (совместимость со старыми вкладками). Остаток: у ученика `GET /api/notifications` без `limit` (его берёт главная ученика) по-прежнему собирает каждую запись отдельными запросами — данных у одного ученика мало, но при росте стоит перевести на пакетную загрузку; индекс `notifications_* (deleted, creation_datetime)` — см. п.14.
10. 🟠 **N+1 при открытии lexis учеником** (`handlers/student/lexis_handlers.py:get_by_id`): для каждой карточки `add_user_dictionary_if_not_exists` (INSERT на GET-запросе) + `get_ditcionary_item` — по 2 транзакции на слово. → Одна выборка `Dictionary LEFT JOIN UserDictionary` по списку id + bulk insert недостающих.
11. 🟠 **Транзакция на каждую query-функцию.** Хендлер вызывает 5–20 функций, каждая делает `with DBsession.begin()` — отдельный checkout соединения и коммит; нет атомарности бизнес-операции. → Сессия на запрос (`scoped_session` + `teardown_appcontext`), query-функции принимают `session`.
12. 🟠 **Таймеры `threading.Timer` для time_limit** (`routes/routes_utils.py`): поток на каждую попытку, всё в памяти процесса; `on_start_app` выполняется в **каждом** воркере gunicorn → дублирующиеся таймеры. → «Ленивое» закрытие: дедлайн = `start + time_limit`, просроченные попытки закрываются при чтении/следующем действии (или один периодический job).
13. 🟢 Пул соединений `20 + 30` на процесс — при нескольких воркерах легко упереться в `max_connections` MySQL.
14. 🟢 Нет составных индексов под частые фильтры: `*_tries (base_id, user_id, end_datetime)`, `notifications_* (deleted, creation_datetime)`, `quizlet_sessions (user_id, updated_at)`. Проверить `EXPLAIN` на проде.
15. 🟢 `FlaskUser` читается из БД на каждый запрос отдельной транзакцией — терпимо, но при переходе на сессию-на-запрос объединить.

## Архитектура и качество кода

16. 🟠 **Нарушение слоёв.** `queries/StudentDBqueries.py` импортирует из `handlers.common` и бросает HTTP-исключения (`InvalidAPIUsage`, 403/404); хендлеры импортируют из `routes.routes_utils`. → queries возвращают данные/None или доменные исключения; `get_current_user_id` и таймеры вынести из `routes`.
17. 🟠 **Файлы-монолиты:** `StudentDBqueries.py` (1539 строк), `db_models.py` (1417), `TeacherDBqueries.py` (1255), `routes.py` (867), `models/assessment.py` (941). → Пакеты по фичам (`quizlet/`, `tasks/`, `notifications/`, `activities/`) с routes/handlers/queries/models внутри.
18. 🟢 **Бойлерплейт в `routes.py`**: ~120 одинаковых функций-обёрток. → Декораторы `@teacher_only/@student_only` или таблица регистрации роутов; для однотипных активностей — генерация роутов из `activities_data`.
19. 🟢 `from ... import *` в `handlers/{teacher,student}/__init__.py` — одноимённые функции разных модулей молча перекрывают друг друга.
20. 🟢 **Самодельные форматы хранения:** `done_tasks` у lexis — строка `"card: 100,findpair: 50"` с ручным парсингом; остальное — JSON в `Text` без схемы. Опечатки, ставшие частью формата данных: ключ `cheked` в `checked_tasks`, `SENTENCE_OREDER`, `get_ditcionary_item`, `create_custom_trigers`. Переименование требует миграции данных.
21. 🟢 **Дублирование:** триггеры — три копии одного SQL (`common.py`); `CustomJSONEncoder` не используется (жив `NewCustomJSONEncoder`); список «неответных» заданий и подсчёт правильных ответов продублированы в `StudentDBqueries._get_correct_answers_count` и `teacher/notifications_handlers._get_homework_try_metrics`.
22. 🟢 **Триггеры создаются кодом при старте**, а не миграцией: нужны права TRIGGER у пользователя приложения, синтаксис `CREATE OR REPLACE TRIGGER` — только MariaDB.
23. 🟢 **Конфигурация:** `load_config("config.json")` относительно cwd, читается несколько раз, в т.ч. при импорте модуля (`UPLOAD_FOLDER`) — мешает тестам. → Один объект настроек, поддержка переменных окружения.
24. 🟢 **Логирование:** root-логгер на уровне DEBUG в проде; `LogI/LogE` — `print` с ANSI-цветами; `InvalidAPIUsage` логирует в конструкторе (устаревший `logger.warn`); `print("ex", ex)` в `teacher/assessment_handlers.py`; голый `except:` в `main.py`.
25. 🟢 `datetime.now()` (naive, локальное время сервера) повсюду — при смене TZ сервера/БД сломаются дедлайны. → UTC.

## Инфраструктура и тесты

26. 🟠 **Тесты не запускаются стандартно:** `make test`/`tests.sh` указывают несуществующий путь `server/tests/assessment`, в `tests/assessment` нет `__init__.py`; pytest и pytest-mock не в requirements; README ссылается на несуществующий `RunTests.sh`. Серверные тесты не запускаются в CI. Покрыты только автопроверка assessment, auth и quizlet.
27. 🟠 **Зависимости:** `requirements.txt` в UTF-16 (плохо для diff/grep), смешаны прод- и dev-зависимости (mypy, pylint, yapf), одновременно `mysql-connector-python` и `PyMySQL`, нет `gunicorn`. Flask/Werkzeug 2.2 устарели (есть исправления безопасности в 3.x).
28. 🟢 Мусор в репозитории: `server/experiments/`, `assessment_example*.json`, `sql_files/`, корневые `OtherData/`, `TODO1.PNG`, `client/package-lock copy.json`.
29. 🟢 Скрипт деплоя сервера (`copy_server.sh`) живёт только на проде — не версионируется.

## Предлагаемый порядок

1. Пункты 1–3 (безопасность, небольшие изменения).
2. ~~Пункт 9~~ (сделано) + 26 (починить запуск тестов, добавить в CI).
3. Пункты 6, 10, 12.
4. Постепенно: сессия-на-запрос (11) и разбиение на пакеты по фичам (16–17) — по одной фиче за раз.
