# Клиент: узкие места и план улучшений

Результат ревью (сентябрь 2026). Приоритет: 🔴 высокий, 🟠 средний, 🟢 низкий. После исправления пункта удаляй его или помечай «сделано».

## Корректность и надёжность

1. ✅ **Сделано:** ошибки TypeScript исправлены (типы уведомлений ученика приведены к ответу сервера), добавлен `npm run typecheck` и шаг в CI.
2. 🟢 **Частично сделано: отмена запросов и защита от гонок.** Подключён TanStack Query (`libs/queryClient.ts`, провайдер в `main.tsx`): `queryFn` получает `signal`, устаревшие запросы отменяются, данные кешируются. На него переведены Quizlet (ученик и учитель), Review, банк заданий/домашки учителя, сессия пользователя, курсы, уроки, прохождение активностей, словарь, уведомления и главная. **Осталось:** ~10 файлов со старым `useEffect` + `AjaxGet` (History, результаты попыток, страницы создания/редактирования курсов/уроков/активностей, `useCursorPagedList`) — переводить при изменениях. `eslint-disable react-hooks/exhaustive-deps` — 13 мест (было 25).
3. ✅ **Сделано:** `libs/ServerAPI.ts` — `urlParams` кодируются (`URLSearchParams`, `null`/`undefined` пропускаются); `Content-Type` только при наличии тела; пустой ответ (204) → `undefined`; ошибки — класс `ApiError` (`kind`: `http`/`network`/`parse`/`abort`, `status` 0 для сети) с совместимыми полями `isServerError/json/response`; `getApiErrorMessage(e, fallback)`; параметр `signal`. Ответ 401 вызывает обработчик из `App.tsx` (`setUnauthorizedHandler`): кеш запросов очищается, пользователь сбрасывается → страница входа.
4. 🟠 **HTML в markdown без санитизации.** `components/Common/ReactMarkdownWithHtml.tsx` использует `rehype-raw` — любой HTML из текста заданий исполняется как есть. Сейчас контент пишет учитель, но если туда попадёт ввод учеников (ответы, ассоциации) — XSS. Также `dangerouslySetInnerHTML` в `libs/AutosizeDiv.tsx`, `AutosizeInput.tsx`. → `rehype-sanitize` с белым списком тегов.

## Производительность

5. ✅ **Сделано:** страницы в `App.tsx` грузятся через `lazy()` + `Suspense`, markdown-рендер (`ReactMarkdownWithHtml`) — отдельным чанком. Стартовый `index-*.js`: 1164 → 272 КБ (gzip 320 → 82 КБ). Дальше можно вынести `AssignmentsHub`/уведомления главной, если понадобится.
6. ✅ **Сделано:** шрифты в WOFF2 с `font-display: swap` (`scripts/build_fonts.py`). `APJapanesefont` разрезан по `unicode-range`: кана 48 КБ, латиница/символы 80 КБ, кандзи 2.3 МБ (было 5.6 МБ одним файлом на любой японский символ); `CenturyGothic` 333 → 59 КБ. Возможное продолжение: выделить частые кандзи (JIS уровень 1 ≈ 0.9 МБ) в отдельный файл — но это ~5–7 тыс. диапазонов в `unicode-range` (десятки КБ CSS для всех пользователей), поэтому пока не сделано.
7. ✅ **Сделано:** один источник опроса — `NotificationsPoller` в `App.tsx` (`useNotificationsPolling`): раз в минуту лёгкий `GET /api/notifications/unread_count`, во фоновой вкладке пауза, при возвращении — обновление. `useNotificationsHubSync` (главная и Quizlet ученика) своего таймера не ставит: грузит данные при монтировании, при росте счётчика и возвращении на вкладку. Окно уведомлений и `/teacher/history` грузят данные страницами по кнопке «Показать ещё» (`libs/useCursorPagedList.ts`). `StudentAssessmentViewDoneTryPage` больше не опрашивает список каждые 10 с — реагирует на счётчик. Остаток: компонент `NavBar/Dictionary` (свой интервал 30 с) нигде не подключён — удалить или перевести на общий опрос, если понадобится.
8. ✅ **Сделано:** гигантские компоненты разбиты (самый большой файл теперь ~480 строк): страницы-оркестраторы разбирают URL и собирают подкомпоненты из `Quizlet/Student/`, `Quizlet/Teacher/`, `Quizlet/shared/`, `Review/*`, `Tasks/Teacher/`, `WheelTrainer/*`. Логика вынесена в хуки (`useQuizletSession`, `useReviewTraining`, `useWheelTrainerStudio`, `useTeacherCatalogActions`), сложные формы — `useReducer` (`assignmentFormReducer`, `assignmentWizard`, `reviewSetupReducer`, `wheelStudioReducer`), чистые функции — в модулях (`reviewTraining.ts`, `tasksUtils.ts`, `wheelTrainerModel.ts`). Три копии редактора таблицы слов Quizlet объединены в `Quizlet/shared/QuizletWordsEditor.tsx`. Попутно исправлено: редактор темы учителя не сбрасывался при переходе на другую тему; после действий страница больше не перезагружается целиком (раньше — полноэкранный Loading после каждого сохранения).
9. 🟢 `public/test_data` (~0.9 МБ тестовых картинок/mp3) попадает в прод-сборку.

## Архитектура и качество кода

10. 🟢 **Частично сделано: слой запросов.** Модули `src/api/<фича>.ts` (алиас `api/`): типы ответов, ключи кеша (`quizletKeys`…), `queryOptions` (`quizletQueries.catalog()`…) и функции мутаций. Есть для `user`, `courses`, `lessons`, `activities`, `dictionary`, `notifications`, `quizlet`, `review`, `tasks`. **Осталось:** запросы страниц создания/редактирования (`*ProcessingUtils`), History и перенос `requests/` (`User`, `Activity`) в `api/`.
11. ✅ **Сделано:** Redux удалён целиком (`@reduxjs/toolkit`, `react-redux`, `src/redux`). Серверные данные и сессия — в кеше TanStack Query, UI-состояние — локально или в контексте страницы (см. [architecture.md](architecture.md#состояние)). Попутно удалены неиспользуемые слайсы `login`/`register` и мёртвый проп `onDeadline` у `StudentActivityBubble`.
12. 🟢 **Типы API ведутся вручную** и расходятся с сервером (см. п.1). → Генерация из Pydantic (например, `pydantic-to-typescript`) или хотя бы zod-схемы на границе (zod уже в зависимостях, используется в одном месте).
13. 🟢 **Тестов нет**, хотя в devDependencies есть `@testing-library/*`, а `@types/jest` — в dependencies. → Vitest + testing-library, начать с чистых функций (`quizletUtils`, `quizletTableClipboard`, валидация assessment).
14. 🟢 **Зависимости и мусор:** `name: "test"` в package.json; `crypto-js` и `web-vitals` не используются (`reportWebVitals.js` написан под API web-vitals v2 и сломается при вызове с v5); `@types/*` и `typescript` в `dependencies`; два плагина сортировки импортов (`@ianvs/...` и `@trivago/...`); `typescript-plugin-css-modules` указан в tsconfig, но не установлен; `public/index.html` (от CRA, с `%PUBLIC_URL%`) не используется; `package-lock copy.json`; `libs/uuid.ts` — самописный, есть `crypto.randomUUID()`.
15. 🟢 Опечатки, закрепившиеся в коде/данных: `libs/Autisize.ts`, поле `cheked` из API.
16. 🟢 Смешение стилей: CSS Modules, глобальные `.css` с BEM-подобными классами и SCSS. Для новых компонентов выбрать один вариант (рекомендуется CSS Modules).

## Предлагаемый порядок

1. ~~п.1 (починить типы + typecheck в CI)~~ — сделано.
2. ~~п.5–6 (lazy routes, WOFF2-шрифт)~~ — сделано.
3. ~~п.7 + серверный п.9 (уведомления)~~ — сделано.
4. ~~п.2–3 + п.10 + п.8: TanStack Query, `ServerAPI`, модули `api/`, разбиение гигантских компонентов~~ — сделано для Quizlet/Review/Tasks/WheelTrainer.
5. ~~п.2/п.10/п.11: перевести разделы с Redux-слайсов на `api/` + TanStack Query, удалить Redux~~ — сделано. Остаток п.2/п.10 (History, результаты попыток, страницы редактирования, `requests/`) — при изменениях.
