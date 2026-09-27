# Client (React SPA)

Все команды — из папки `client/`. Подробная документация: [docs/client/architecture.md](../docs/client/architecture.md), известные проблемы: [docs/client/improvements.md](../docs/client/improvements.md).

## Команды

- `npm start` / `npm run dev` — Vite dev server на `:3000`, проксирует `/api` и `/uploads` на Flask `127.0.0.1:5000`.
- `npm run lint` — ESLint (запускается в CI, должен проходить).
- `npm run build` — сборка в `dist/` (в CI). vite build не проверяет типы — для этого `npm run typecheck` (`tsc --noEmit`, тоже в CI).
- Тестов нет (test runner не настроен).

## Структура `src/`

- `App.tsx` — все маршруты. Доступ по ролям через `getRoute(teacher, student, unlogged)`, `getTeacherRoute`, `getLoggedRoute`. Страницы подключаются через `lazy()` (отдельные чанки) — новые тоже, и не через барелы `index.ts`.
- `components/<Фича>/` — страницы и компоненты по фичам (Activities, Courses, Lessons, Quizlet, Tasks, Review, Notifications, History, WheelTrainer…).
- `libs/ServerAPI.ts` — `AjaxGet/AjaxPost/AjaxPatch/AjaxDelete<T>({ url, body, urlParams })`. Ошибка с ответом сервера проверяется `isProcessableError<T>(e)` → `e.json.message`.
- `libs/Status.ts` — `LoadStatus` (NONE/LOADING/DONE/ERROR) и тип `LoadStatus.DataDoneOrNotDone<T>` для загружаемых данных.
- `models/` — TS-типы ответов API (`T*.ts`), должны совпадать с сервером.
- `redux/` — store (`store.ts`), slices, типизированные хуки `useAppDispatch/useAppSelector` (`redux/hooks.ts`).
- `requests/` — частично вынесенные запросы (большинство запросов пока прямо в компонентах).

## Правила

- Импорты через алиасы: `components/...`, `libs/...`, `models/...`, `redux/...`, `ui/...` и т.д. (vite.config.ts + tsconfig paths).
- Стили: CSS Modules (`*.module.css`) или локальный `.css`/SCSS рядом с компонентом; UI на react-bootstrap + bootstrap-icons.
- Форматирование prettier (4 пробела, ширина 120, CRLF, сортировка импортов плагином).
- Тексты интерфейса на русском.
- Не добавлять новые компоненты в и без того огромные файлы (`TeacherReview.tsx`, `StudentQuizlet.tsx`, `TeacherQuizletManager.tsx`, `TeacherTasksManager.tsx`, `WheelTrainerPage.tsx`) — выносить в отдельные файлы рядом.
