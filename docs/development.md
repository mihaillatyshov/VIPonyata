# Разработка

## Требования

- Python 3.10+ (локально используется 3.12, venv — `server/.venv`).
- MySQL 8 / MariaDB (триггеры используют `CREATE OR REPLACE TRIGGER` — синтаксис MariaDB).
- Node.js 20 (как в CI).

## Сервер

```bash
cd server
python -m venv .venv
source .venv/Scripts/activate      # Windows Git Bash; Linux: .venv/bin/activate
pip install -r requirements.txt    # файл в UTF-16, pip его читает
cp config.json.example config.json # заполнить db, uploads (абсолютный путь), flask_secret, logs_folder
alembic upgrade head
python main.py                     # http://127.0.0.1:5000/api/...
```

- `make dev` — миграции + запуск.
- `make fill_db` — **удаляет** БД из `config.json`, создаёт заново, применяет миграции и заполняет тестовыми данными (`server/CreateTestDB.py`). Только для локальной БД.
- Логи пишутся в `logs_folder/server.log` (ротация в полночь) + цветной вывод `LogI/LogW/LogE` в stdout.

### Миграции

```bash
alembic revision --autogenerate -m "short_name"
# проверить сгенерированный файл в migrations/versions, убрать лишнее
alembic upgrade head
```

Цепочка миграций линейная (одна голова). Триггеры в миграциях не описаны — создаются кодом при старте приложения.

### Тесты

- `tests/assessment` — unittest, чистые юнит-тесты автопроверки заданий, БД не нужна. Запуск всех:
  ```bash
  python -c "import unittest,glob,os; s=unittest.TestSuite([unittest.defaultTestLoader.loadTestsFromName(f[:-3].replace(os.sep,'.').replace('/','.')) for f in glob.glob('tests/assessment/Test*.py')]); unittest.TextTestRunner(verbosity=2).run(s)"
  ```
  или по одному: `python -m unittest tests.assessment.TestFindPair`.
- `tests/user` — pytest (+ `pytest-mock`, установить отдельно), нужен `config_test.json` (как `config.json`, но с отдельной тестовой БД — таблицы создаются и удаляются на каждый тест).
- `make test` и `tests.sh` сейчас не работают (см. [server/improvements.md](server/improvements.md)).

## Клиент

```bash
cd client
npm ci
npm start           # http://localhost:3000, прокси /api и /uploads -> 127.0.0.1:5000
npm run lint
npm run build       # dist/
npm run typecheck   # проверка типов tsc --noEmit (vite build её не делает; есть в CI)
```

## CI/CD

Push в `master` → GitHub Actions (`.github/workflows/ci_cd.yml`): lint + build клиента, выкладка `dist` по scp, запуск скрипта деплоя сервера по ssh. Тесты сервера в CI не запускаются.

## Стиль кода

- Python: yapf (`server/.style.yapf`, ширина 120), pylint (`server/.pylintrc`), mypy (`server/mypy.ini`).
- TS/React: prettier (`.prettierrc` в корне: 4 пробела, 120 символов, CRLF, сортировка импортов), ESLint (`client/eslint.config.mjs`).
