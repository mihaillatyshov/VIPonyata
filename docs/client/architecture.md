# Клиент: архитектура

React 19 + TypeScript (strict) + Vite 8. UI: react-bootstrap / Bootstrap 5 (SCSS) + bootstrap-icons. Серверные данные: TanStack Query 5; состояние сессии/UI: Redux Toolkit (постепенно уходим) + локальный state. Роутинг: react-router-dom 7 (`BrowserRouter`). DnD: `@dnd-kit`. Markdown в заданиях: `react-markdown` + `rehype-raw`.

## Структура `src/`

```
main.tsx                 корень: QueryClientProvider + Provider(store) + App, глобальные стили (bootstrap.scss, assets/scss/index.scss)
App.tsx                  загрузка /api/islogin, обработчик 401, выбор маршрутов по роли, все <Route>
api/                     слой запросов по фичам (quizlet, review, tasks): типы ответов, ключи кеша, queryOptions, мутации
components/
  Activities/            Lexis (Drilling, Hieroglyph), Assessment (редактор, прохождение, просмотр попыток), общие виджеты
  Authentication/        логин, регистрация, профиль
  Courses/, Lessons/     списки, карточки, страницы создания/редактирования
  Dictionary/            словарь ученика
  Quizlet/               тренировки слов: StudentQuizlet (→ Student/), TeacherQuizletManager (→ Teacher/), общие
                         компоненты в shared/ (редактор таблицы слов, карточки, хлебные крошки), упражнения Matching/Flashcard
  Tasks/                 банк заданий и домашние работы: TeacherTasksManager (→ Teacher/), StudentTasksPage
  Review/                повторение слов учителем: TeacherReview + страницы словарей, тренировка (useReviewTraining)
  Notifications/, History/, MainPage/, NavBar/, WheelTrainer/, ErrorPages/, Common/, Form/
libs/                    ServerAPI (fetch-обёртка), queryClient (TanStack Query), Status (LoadStatus), useCursorPagedList (списки с «Показать ещё»), useTimer, autosize-утилиты, DragAndDrop
models/                  TS-типы данных API (TCourse, TLesson, TQuizlet, TTasks, TNotification, Activity/...)
redux/                   store.ts, hooks.ts, slices/*, funcs/* (хуки и селекторы поверх слайсов)
requests/                старые вынесенные запросы (Lesson, User, Activity); новое — в api/
ui/                      мелкие переиспользуемые UI-компоненты
validators/              валидаторы форм
themes/                  CSS-модуль тем (используется тема Violet)
```

Алиасы импортов (`vite.config.ts` + `tsconfig.json` `paths`): `api/`, `assets/`, `components/`, `libs/`, `models/`, `redux/`, `requests/`, `themes/`, `ui/`, `validators/`.

## Маршрутизация и роли

Все маршруты — в `App.tsx`. При старте приложение ждёт ответ `/api/islogin` (пока — полноэкранный Loading). Затем:

- `getRoute(teacherEl, studentEl, unloggedEl = <NavigateHome/>)` — разные страницы по роли;
- `getTeacherRoute(el)` — только учитель; `getLoggedRoute(el)` — любой авторизованный.

Страницы (кроме `LoginPage`, `MainPage`, `NavBar`, `ErrorPage`) подключаются через `lazy()` и грузятся отдельными чанками; `<Routes>` обёрнут в `Suspense`. Новую страницу добавляй так же — `lazy(() => import("components/..."))`, не через барелы `components/Quizlet`, `components/Tasks` (они склеивают страницы учителя и ученика в один чанк). Если чанк не загрузился (после деплоя старые файлы удаляются), `main.tsx` один раз перезагружает страницу по `vite:preloadError`.

Проверка ролей на клиенте — только UX; реальная проверка доступа на сервере.

## Работа с API

Низкий уровень — `libs/ServerAPI.ts`: `AjaxGet/AjaxPost/AjaxPatch/AjaxDelete<T>({ url, body?, urlParams?, signal? })`.

- `urlParams` кодируются, `null`/`undefined` пропускаются; `Content-Type: application/json` — только если есть `body`; пустой ответ (204) → `undefined`.
- Ошибка — `ApiError`: `kind` (`http` — ответ 4xx/5xx, `network` — нет ответа, `parse` — не JSON, `abort` — отменён), `status` (0 без ответа), `json`, `response`. `isProcessableError<T>(e)` — ответ сервера с JSON; `getApiErrorMessage(e, "Текст по умолчанию")` — `json.message` или запасной текст. Поле `isServerError` сохранено для старого кода.
- Ответ 401 (сессия истекла) → обработчик из `App.tsx` очищает кеш запросов и сбрасывает пользователя (показывается вход).
- Загрузка файлов — отдельно через `FormData` (`components/Form/InputImage.tsx`, `InputAudio.tsx`).

Над ним — модули `api/<фича>.ts` и TanStack Query (`libs/queryClient.ts`: повтор только для сетевых ошибок и 5xx, без перезапроса при фокусе окна):

```ts
// api/quizlet.ts
export const quizletKeys = { all: ["quizlet"] as const, catalog: () => [...quizletKeys.all, "catalog"] as const, ... };
export const quizletQueries = {
    catalog: () => queryOptions({
        queryKey: quizletKeys.catalog(),
        queryFn: ({ signal }) => AjaxGet<TQuizletCatalog>({ url: "/api/quizlet/groups", signal }),
    }),
};
export const deleteQuizletGroup = (groupId: number) => AjaxDelete({ url: `/api/quizlet/groups/${groupId}` });

// компонент
const catalogQuery = useQuery(quizletQueries.catalog());
if (catalogQuery.isError) return <ErrorPage ... />;
if (catalogQuery.isPending) return <Loading />;

await deleteQuizletGroup(id);
await queryClient.invalidateQueries({ queryKey: quizletKeys.catalog() }); // перезапрос; устаревший запрос отменяется
```

- Новый код: запросы — только через `api/`, данные — через `useQuery`/`useMutation`, без ручного `LoadStatus` и `useEffect`-загрузок.
- Редакторы с локальным черновиком (таблицы слов) инициализируются из данных один раз и перемонтируются по `key`; после сохранения берут свежие данные из результата `onSave` (`queryClient.fetchQuery`), а не из эффекта на изменение пропсов.
- Старый код: данные с состоянием загрузки хранятся как `LoadStatus.DataDoneOrNotDone<T>`: `{ loadStatus: LoadStatus.DONE, ...data } | { loadStatus: NONE|LOADING|ERROR }`.

## Состояние

- **Redux** (`redux/store.ts`): `user` (текущий пользователь), `login`, `register`, `notificationsHub` (счётчик непрочитанных — опрос раз в 60 с через `useNotificationsPolling` в `NotificationsPoller`, единственный на приложение; данные главной ученика — уведомления, назначения, статистика — через `useNotificationsHubSync` без своего таймера), `courses`, `lessons`, `drilling`, `hyeroglyph` (sic), `assessment` (прохождение активностей), `dictionary`.
- **Правило:** серверные данные — кеш TanStack Query (`api/`), Redux — только сессия пользователя и UI. Redux-слайсы с серверными данными — наследие, их переводим на запросы при изменениях (план — в [improvements.md](improvements.md)).
- На TanStack Query уже работают Quizlet, Review, раздел заданий учителя. History и часть главной пока грузят данные сами в `useEffect`.
- Большие страницы устроены как оркестратор (разбор URL → подкомпоненты) + хуки состояния (`useQuizletSession`, `useReviewTraining`, `useWheelTrainerStudio`); сложные формы — `useReducer` (`*Reducer.ts`, `assignmentWizard.ts`).
- `localStorage` — черновики/шаблоны WheelTrainer, незавершённая тренировка и история TeacherReview.

## Стили

CSS Modules (`Style*.module.css`) для старых частей, обычные `.css` рядом с компонентом для новых (Quizlet, Tasks, Review), глобальный SCSS в `assets/scss`. Шрифты — WOFF2 в `assets/fonts` (подключаются в `App.css`), генерируются скриптом `client/scripts/build_fonts.py` из TTF в `client/fonts-src`. `APJapanesefont` разрезан на части (латиница/символы, кана, кандзи) по `unicode-range`: браузер скачивает только нужные. Семейство `APJapanesefont` — только японские символы, `APJapanesefontImportant` — весь шрифт.

## Сборка

`npm run build` → `dist/`: стартовый чанк `index-*.js` (~280 КБ, react/bootstrap/redux/tanstack-query + логин и главная), отдельные чанки страниц и `ReactMarkdownWithHtmlImpl` (react-markdown + rehype-raw, ~290 КБ; грузится только где есть markdown). В `index.html` подключена Яндекс.Метрика. Содержимое `public/` копируется в `dist` как есть.
