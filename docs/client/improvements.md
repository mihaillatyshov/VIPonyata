# Клиент: узкие места и план улучшений

Результат ревью (сентябрь 2026). Приоритет: 🔴 высокий, 🟠 средний, 🟢 низкий. После исправления пункта удаляй его или помечай «сделано».

## Корректность и надёжность

1. 🔴 **34 ошибки TypeScript, которые не ловит CI.** `vite build` не проверяет типы, в CI только lint + build. `npx tsc --noEmit` падает: больше всего в `redux/slices/notificationsHubSlice.ts` (15), `models/TNotification.ts`, `Notifications/StudentNotificationsContent.tsx`, `Assessment/AssessmentTaskImageWrappers.tsx`. Типы уведомлений не соответствуют реальному использованию.
   → Исправить ошибки, добавить `"typecheck": "tsc --noEmit"` в scripts и шаг в CI.
2. 🟠 **Нет отмены запросов и защиты от гонок.** Ни одного `AbortController`; данные грузятся в `useEffect` по id из URL — при быстрой навигации ответ старого запроса может перезаписать новый, `setState` после размонтирования. В 25 местах отключено правило `react-hooks/exhaustive-deps` — зависимости эффектов проверять вручную.
   → Хук `useApi(url, deps)` с отменой, либо RTK Query / TanStack Query (заодно кеширование и дедупликация).
3. 🟠 **`libs/ServerAPI.ts`:** параметры `urlParams` не кодируются (`encodeURIComponent`); `Content-Type: application/json` ставится и для GET; ответ без тела (204) превращается в «JSON Error!»; сетевые ошибки маскируются под 500; типы `any` в ошибках. Нет единого перехвата 401 (истёкшая сессия не ведёт на логин).
4. 🟠 **HTML в markdown без санитизации.** `components/Common/ReactMarkdownWithHtml.tsx` использует `rehype-raw` — любой HTML из текста заданий исполняется как есть. Сейчас контент пишет учитель, но если туда попадёт ввод учеников (ответы, ассоциации) — XSS. Также `dangerouslySetInnerHTML` в `libs/AutosizeDiv.tsx`, `AutosizeInput.tsx`. → `rehype-sanitize` с белым списком тегов.

## Производительность

5. 🔴 **Один бандл на всё приложение**: `index-*.js` ≈ 1.1 МБ, `React.lazy` не используется — ученик грузит редакторы учителя, WheelTrainer, Review и т.д. → `lazy()` + `Suspense` на уровне маршрутов в `App.tsx`, отдельные чанки для учительских разделов.
6. 🔴 **Шрифт `APJapanesefont.ttf` весит 5.6 МБ** (плюс `CenturyGothic` 330 КБ), TTF без сжатия и без `font-display`. → Конвертировать в WOFF2, сделать subset (только нужные глифы/диапазоны), `font-display: swap`.
7. 🟠 **Несколько polling-интервалов одновременно.** `useNotificationsHubSync` вызывается в `NavBar`, `MainPage`, `AssignmentsHub`, `StudentQuizlet` — каждый вызов ставит свой `setInterval` (частично гасится проверкой staleness), плюс отдельные интервалы в `NavBar/Dictionary` (30 с), `StudentAssessmentViewDoneTryPage` (10 с). Опрос продолжается во фоновой вкладке. Для учителя каждый опрос — тяжёлый запрос (см. server/improvements.md п.9).
   → Один источник polling (в корне приложения), пауза при `document.hidden`, лёгкий эндпоинт счётчика непрочитанных.
8. 🟠 **Гигантские компоненты**: `Review/TeacherReview.tsx` (2634 строки, 34 `useState`), `Quizlet/TeacherQuizletManager.tsx` (2103), `Quizlet/StudentQuizlet.tsx` (2098), `Tasks/TeacherTasksManager.tsx` (1769), `WheelTrainer/WheelTrainerPage.tsx` (1499). Любое изменение состояния перерисовывает всё дерево, код трудно читать и менять.
   → Разбить на подкомпоненты + хуки данных (`useQuizletCatalog`, …), состояние сложных форм — `useReducer`.
9. 🟢 `public/test_data` (~0.9 МБ тестовых картинок/mp3) попадает в прод-сборку.

## Архитектура и качество кода

10. 🟠 **Нет единого слоя запросов.** `requests/` используется частично, в ~36 компонентах прямые `AjaxGet/AjaxPost` с одинаковыми `.then/.catch` и ручным `LoadStatus`. → Модули API по фичам (`api/quizlet.ts` …) с типизированными функциями; позже — RTK Query.
11. 🟠 **Смешанный подход к состоянию:** старые разделы в Redux-слайсах, новые — в локальном state. Нужно выбрать правило (серверные данные — query-кеш, Redux — только сессия/UI) и описать его.
12. 🟢 **Типы API ведутся вручную** и расходятся с сервером (см. п.1). → Генерация из Pydantic (например, `pydantic-to-typescript`) или хотя бы zod-схемы на границе (zod уже в зависимостях, используется в одном месте).
13. 🟢 **Тестов нет**, хотя в devDependencies есть `@testing-library/*`, а `@types/jest` — в dependencies. → Vitest + testing-library, начать с чистых функций (`quizletUtils`, `quizletTableClipboard`, валидация assessment).
14. 🟢 **Зависимости и мусор:** `name: "test"` в package.json; `crypto-js` и `web-vitals` не используются (`reportWebVitals.js` написан под API web-vitals v2 и сломается при вызове с v5); `@types/*` и `typescript` в `dependencies`; два плагина сортировки импортов (`@ianvs/...` и `@trivago/...`); `typescript-plugin-css-modules` указан в tsconfig, но не установлен; `public/index.html` (от CRA, с `%PUBLIC_URL%`) не используется; `package-lock copy.json`; `libs/uuid.ts` — самописный, есть `crypto.randomUUID()`.
15. 🟢 Опечатки, закрепившиеся в коде/данных: ключ стора `hyeroglyph`, `libs/Autisize.ts`, поле `cheked` из API.
16. 🟢 Смешение стилей: CSS Modules, глобальные `.css` с BEM-подобными классами и SCSS. Для новых компонентов выбрать один вариант (рекомендуется CSS Modules).

## Предлагаемый порядок

1. п.1 (починить типы + typecheck в CI) — дёшево и сразу ловит баги.
2. п.5–6 (lazy routes, WOFF2-шрифт) — самый заметный выигрыш для пользователей, особенно на мобильных.
3. п.7 + серверный п.9 (уведомления).
4. п.2–3 + п.10: общий слой запросов с отменой; при рефакторинге больших компонентов (п.8) переводить их на него.
