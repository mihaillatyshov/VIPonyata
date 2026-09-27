# VIPonyata

Веб-платформа для изучения японского языка: преподаватель (teacher) создаёт курсы, уроки и задания, ученики (student) их проходят. Прод: `jp.lann.ru`.

Монорепозиторий из двух независимых частей:

- `server/` — Python 3.10+, Flask 2.2, SQLAlchemy 2.0, Pydantic 2, Alembic, MySQL/MariaDB. Подробности: [server/CLAUDE.md](server/CLAUDE.md).
- `client/` — React 19 + TypeScript + Vite, Redux Toolkit, React Router 7, react-bootstrap + SCSS. Подробности: [client/CLAUDE.md](client/CLAUDE.md).

## Документация

Начинай с [docs/README.md](docs/README.md). Ключевое:

- [docs/architecture.md](docs/architecture.md) — как устроена система целиком, деплой.
- [docs/domain.md](docs/domain.md) — предметная область и словарь терминов (drilling, hieroglyph, assessment, quizlet, tasks, review…).
- [docs/development.md](docs/development.md) — запуск, тесты, миграции.
- [docs/ai/workflow.md](docs/ai/workflow.md) — правила работы ИИ-агента в этом репозитории. **Прочитай перед изменениями.**
- Известные проблемы и план улучшений: [docs/server/improvements.md](docs/server/improvements.md), [docs/client/improvements.md](docs/client/improvements.md).

## Главные правила

- Команды сервера выполняются из `server/`, клиента — из `client/`. Конфиг сервера — `server/config.json` (в git не хранится, шаблон `config.json.example`).
- Все HTTP-эндпоинты имеют префикс `/api`. Контракт API меняется синхронно на сервере и в клиенте (`client/src/models/*`).
- Любое изменение схемы БД — только через Alembic-миграцию (`server/migrations/versions`).
- Тексты интерфейса и сообщения об ошибках для пользователя — на русском.
- Форматирование: Python — yapf (`.style.yapf`, ширина 120), TS — prettier (`.prettierrc`, ширина 120, 4 пробела, CRLF). CI запускает `npm run lint` и `npm run build` для клиента — они должны проходить.
- Push в `master` = автодеплой (GitHub Actions). Не пушить без явной просьбы.
