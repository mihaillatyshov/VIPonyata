# Клиент: архитектура

React 19 + TypeScript (strict) + Vite 8. UI: react-bootstrap / Bootstrap 5 (SCSS) + bootstrap-icons. Состояние: Redux Toolkit + локальный `useState`. Роутинг: react-router-dom 7 (`BrowserRouter`). DnD: `@dnd-kit`. Markdown в заданиях: `react-markdown` + `rehype-raw`.

## Структура `src/`

```
main.tsx                 корень: Provider(store) + App, глобальные стили (bootstrap.scss, assets/scss/index.scss)
App.tsx                  загрузка /api/islogin, выбор маршрутов по роли, все <Route>
components/
  Activities/            Lexis (Drilling, Hieroglyph), Assessment (редактор, прохождение, просмотр попыток), общие виджеты
  Authentication/        логин, регистрация, профиль
  Courses/, Lessons/     списки, карточки, страницы создания/редактирования
  Dictionary/            словарь ученика
  Quizlet/               тренировки слов: StudentQuizlet, TeacherQuizletManager, упражнения Matching/Flashcard
  Tasks/                 банк заданий и домашние работы (TeacherTasksManager, StudentTasksPage)
  Review/                повторение слов учителем
  Notifications/, History/, MainPage/, NavBar/, WheelTrainer/, ErrorPages/, Common/, Form/
libs/                    ServerAPI (fetch-обёртка), Status (LoadStatus), useTimer, autosize-утилиты, DragAndDrop
models/                  TS-типы данных API (TCourse, TLesson, TQuizlet, TTasks, TNotification, Activity/...)
redux/                   store.ts, hooks.ts, slices/*, funcs/* (хуки и селекторы поверх слайсов)
requests/                вынесенные запросы (Lesson, User, Activity) — используются частично
ui/                      мелкие переиспользуемые UI-компоненты
validators/              валидаторы форм
themes/                  CSS-модуль тем (используется тема Violet)
```

Алиасы импортов (`vite.config.ts` + `tsconfig.json` `paths`): `assets/`, `components/`, `libs/`, `models/`, `redux/`, `requests/`, `themes/`, `ui/`, `validators/`.

## Маршрутизация и роли

Все маршруты — в `App.tsx`. При старте приложение ждёт ответ `/api/islogin` (пока — полноэкранный Loading). Затем:

- `getRoute(teacherEl, studentEl, unloggedEl = <NavigateHome/>)` — разные страницы по роли;
- `getTeacherRoute(el)` — только учитель; `getLoggedRoute(el)` — любой авторизованный.

Проверка ролей на клиенте — только UX; реальная проверка доступа на сервере.

## Работа с API

`libs/ServerAPI.ts`:

```ts
AjaxGet<TResponse>({ url: "/api/courses" })
AjaxPost<TResponse>({ url: `/api/lessons/${id}/users`, body: { user_id } })
    .then((json) => ...)
    .catch((err) => {
        if (isProcessableError<{ message: string }>(err)) showError(err.json.message); // 4xx/5xx с JSON
        else showError("Ошибка сервера");                                          // сеть / не JSON
    });
```

- Все запросы с `Content-Type: application/json`, cookie отправляются автоматически (same-origin).
- Загрузка файлов — отдельно через `FormData` (`components/Form/InputImage.tsx`, `InputAudio.tsx`).
- Данные с состоянием загрузки хранятся как `LoadStatus.DataDoneOrNotDone<T>`: `{ loadStatus: LoadStatus.DONE, ...data } | { loadStatus: NONE|LOADING|ERROR }`.

## Состояние

- **Redux** (`redux/store.ts`): `user` (текущий пользователь), `login`, `register`, `notificationsHub` (уведомления + назначения, polling раз в 60 с через `useNotificationsHubSync`), `courses`, `lessons`, `drilling`, `hyeroglyph` (sic), `assessment` (прохождение активностей), `dictionary`.
- Большинство новых фич (Quizlet, Tasks, Review, History) держат данные в локальном `useState` компонента и грузят их сами в `useEffect`.
- `localStorage` — черновики/шаблоны WheelTrainer и данные TeacherReview.

## Стили

CSS Modules (`Style*.module.css`) для старых частей, обычные `.css` рядом с компонентом для новых (Quizlet, Tasks, Review), глобальный SCSS в `assets/scss`. Шрифты — `assets/fonts` (подключаются в `App.css`).

## Сборка

`npm run build` → `dist/` (один JS-бандл, code splitting не настроен). В `index.html` подключена Яндекс.Метрика. Содержимое `public/` копируется в `dist` как есть.
