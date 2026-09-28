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
- `api/` — слой запросов по фичам (`quizlet.ts`, `review.ts`, `tasks.ts`): типы ответов, ключи кеша (`quizletKeys`), `queryOptions` (`quizletQueries.catalog()`) и функции мутаций. Используются с TanStack Query (`useQuery`, `useMutation`, `queryClient.invalidateQueries`); клиент — `libs/queryClient.ts`.
- `libs/ServerAPI.ts` — `AjaxGet/AjaxPost/AjaxPatch/AjaxDelete<T>({ url, body, urlParams, signal })`. Ошибка — `ApiError` (`kind`, `status`, `json`); текст для пользователя — `getApiErrorMessage(e, "…")`, проверка ответа с JSON — `isProcessableError<T>(e)`. 401 → выход на страницу входа (обработчик в `App.tsx`).
- `libs/Status.ts` — `LoadStatus` (NONE/LOADING/DONE/ERROR) и тип `LoadStatus.DataDoneOrNotDone<T>` для загружаемых данных.
- `models/` — TS-типы ответов API (`T*.ts`), должны совпадать с сервером.
- `redux/` — store (`store.ts`), slices, типизированные хуки `useAppDispatch/useAppSelector` (`redux/hooks.ts`).
- `requests/` — старые вынесенные запросы; многие старые компоненты ещё вызывают `AjaxGet` прямо в `useEffect`.

## Правила

- Импорты через алиасы: `components/...`, `libs/...`, `models/...`, `redux/...`, `ui/...` и т.д. (vite.config.ts + tsconfig paths).
- Стили: CSS Modules (`*.module.css`) или локальный `.css`/SCSS рядом с компонентом; UI на react-bootstrap + bootstrap-icons.
- Форматирование prettier (4 пробела, ширина 120, CRLF, сортировка импортов плагином).
- Тексты интерфейса на русском.
- Серверные данные — через `api/` + TanStack Query (не `useEffect` + `AjaxGet` + `LoadStatus`, не новые Redux-слайсы). Redux — только сессия/UI; от него постепенно уходим.
- Большие страницы (`StudentQuizlet`, `TeacherQuizletManager`, `TeacherReview`, `TeacherTasksManager`, `WheelTrainerPage`) — тонкие оркестраторы: новые экраны и логику добавлять в подкомпоненты/хуки рядом (`Quizlet/Student/`, `Quizlet/Teacher/`, `Quizlet/shared/`, `Tasks/Teacher/`, `Review/*`, `WheelTrainer/*`), а не в сами файлы страниц.
