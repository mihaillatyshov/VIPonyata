# Архитектура

## Общая схема

```
Браузер ──HTTPS──> nginx (jp.lann.ru)
                    ├── /         -> статические файлы SPA (/home/japan/www/client, fallback на index.html)
                    ├── /api      -> gunicorn (unix socket) -> Flask-приложение (server/main.py:app)
                    └── /uploads  -> статика из /var/www/japan/uploads
                                       │
                                       └── MySQL/MariaDB (SQLAlchemy + PyMySQL)
```

- **Клиент** — SPA на React (Vite). Всё общение с сервером — JSON через `fetch` на относительные URL `/api/...`. Аутентификация — cookie-сессия Flask-Login (`remember=True`), клиент cookie явно не трогает.
- **Сервер** — одно Flask-приложение, один blueprint `/api` (`auth_bp` + `routes_bp`). Один и тот же URL обслуживает и учителя, и ученика: роут выбирает хендлер по роли текущего пользователя (`user_selector_function`).
- **БД** — MySQL/MariaDB. Схема описана в `server/server/models/db_models.py`, версии — Alembic. Помимо миграций, при старте приложения создаются триггеры (`DBHandler.create_custom_trigers` в `server/server/common.py`), запрещающие две незавершённые попытки одной активности у одного пользователя.
- **Файлы** — изображения (конвертируются в webp через Pillow) и mp3 загружаются через `POST /api/upload/img|audio` и кладутся в каталог `uploads` из `config.json`; в БД хранится относительный путь `/uploads/img/xx/yy/<hash>.webp`.

## Роли

`users.level`: `0` — ученик (STUDENT), `1` — учитель (TEACHER). Регистрация через `/api/register` всегда создаёт ученика; учитель назначается вручную в БД. Подразумевается один учитель (многие запросы учителя не фильтруются по владельцу).

## Таймеры активностей

У активности может быть `time_limit`. При старте попытки сервер запускает `threading.Timer`, который по истечении времени закрывает попытку (`end_datetime`). При рестарте сервера незакрытые попытки перечитываются и таймеры перезапускаются (`on_restart_server_check_tasks_timers`). Таймеры живут в памяти процесса.

## Уведомления

Две таблицы: `notifications_student_to_teacher` (ученик завершил попытку/задание — видит учитель) и `notifications_teacher_to_student` (учитель открыл курс/урок, проверил работу, назначил задание). Клиент опрашивает `/api/notifications` раз в минуту (polling, без websocket).

## Деплой

`.github/workflows/ci_cd.yml`, на каждый push в `master`:

1. `build-client`: `npm ci` → `npm run lint` → `npm run build` (Node 20).
2. `deploy-client`: `dist/*` копируется по scp на сервер в `/home/japan/www/client`.
3. `deploy-server`: по ssh запускается `/home/japan/code/copy_server.sh` (скрипт живёт на сервере, не в репозитории; миграции и рестарт gunicorn — внутри него).

Конфиг nginx для справки — `nginx.conf` в корне.
