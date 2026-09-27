# Предметная область

Платформа для занятий японским языком «учитель — ученики». Интерфейс на русском.

## Роли

- **Учитель (teacher, level=1)** — создаёт контент, открывает доступ ученикам, проверяет работы, смотрит историю.
- **Ученик (student, level=0)** — видит только то, к чему ему открыт доступ, проходит задания.

## Структура учебного контента

```
Course (курс)                     courses
 └── Lesson (урок)                lessons
      ├── Drilling  (лексика)     drillings        + drilling_cards   -> dictionary
      ├── Hieroglyph (иероглифы)  hieroglyphs      + hieroglyph_cards -> dictionary
      ├── Assessment (тест)       assessments      (tasks — JSON-массив заданий)
      └── FinalBoss  (итоговый)   final_bosses     (как assessment)
```

- Доступ ученика к курсу/уроку — связующие таблицы `users_courses`, `users_lessons`. Открытие доступа создаёт уведомление ученику.
- **Активность (activity)** — общее название для drilling / hieroglyph / assessment / final_boss. У каждой есть **попытки (try)**: `*_tries` с `start_datetime`, `end_datetime` (NULL = попытка идёт), `try_number`. Одновременно может быть не больше одной незавершённой попытки (триггеры БД).
- **Lexis** — общее название drilling и hieroglyph. Состоят из карточек (слов из общего словаря) и набора подзаданий: `card`, `findpair`, `scramble`, `translate`, `space` (`LexisTaskName`). Прогресс хранится в `done_tasks` строкой вида `"card: 100,findpair: 50"`.
- **Assessment** — тест из заданий. Типы (`AssessmentTaskName`): `text`, `img`, `audio` (информационные), `test_single`, `test_multi`, `create_sentence`, `fill_spaces_exists`, `fill_spaces_by_hand`, `find_pair`, `classification`, `sentence_order`, `open_question` (проверяется учителем вручную), `block_begin`/`block_end` (блок заданий, проверяется целиком через `/checkblock`). Автопроверка — `server/server/handlers/common/assessment_auto_checks.py`. Для каждого типа есть Pydantic-модели: `*TeacherReq` (создание), `*Res` (хранение), `*StudentReq` (ответ ученика); ученику отдаётся `student_dict()` без ответов.
- **Время на выполнение** — `time_limit` активности, по истечении попытка закрывается сервером.

## Словари

- **Dictionary** (`dictionary`) — общий словарь слов (`char_jp`, `word_jp`, `ru`, `img`), используется карточками lexis.
- **UserDictionary** (`users_dictionary`) — персональные дополнения ученика к слову: своя картинка, ассоциация. Страница «Словарь» у ученика.

## Quizlet (тренировка слов)

- Учительский каталог: **группа** (`quizlet_groups`, «урок») → **подгруппа** (`quizlet_subgroups`, «тема») → слова (`quizlet_dictionary` через `quizlet_subgroup_words`).
- Персональный словарь ученика: `user_quizlet_lessons` → `user_quizlet_subgroups` → `user_quizlet_words`. Учитель может просматривать/редактировать и скрывать персональные словари учеников (`quizlet_hidden_students`).
- **Сессия** (`quizlet_sessions`) — тренировка: `quiz_type` (`pair` — сопоставление, `flashcards` — карточки), направление перевода, очередь слов (`queue_state`, JSON), ошибочные слова, повтор ошибок/всех слов.
- **Назначение** (`quizlet_assignments` → `quizlet_assignment_targets` → `quizlet_assignment_results`) — учитель назначает тренировку ученикам с дедлайном; результат попадает учителю в уведомления.

## Tasks (банк заданий и домашние работы)

- **Банк заданий** (`task_bank_items`) — отдельные задания assessment-формата (`task_name`, `task_json`), в том числе извлечённые из уроков (`source_block_index`, скрытие уроков — `task_bank_hidden_lessons`).
- **Домашняя работа** (`homework_assignments` + `homework_assignment_tasks` + `homework_assignment_targets`) — набор заданий из банка, назначенный ученикам. Выполнение — `homework_tries` (`done_tasks`, `checked_tasks` в JSON).

## Review (только учитель)

Личные словари учителя для повторения: `review_dictionaries` → `review_topics` → `review_words` со статусом запоминания (memory state) и результатами тренировок. Раздел `/review` в клиенте.

## Прочее

- **Уведомления** — см. [architecture.md](architecture.md#уведомления). Таблица уведомлений «полиморфная»: у записи заполнен ровно один из FK (`drilling_try_id`, `assessment_try_id`, `homework_try_id`, …), тип вычисляется по нему.
- **История учителя** (`/teacher/history`) — лента всех действий учеников: завершённые активности, сессии quizlet, изменения персональных словарей.
- **Wheel Trainer** (`/teacher/wheel-trainer`) — чисто клиентский инструмент учителя («колесо»), шаблоны хранятся в `localStorage`, сервер не участвует.
- **Главная страница** — сводка незавершённых уроков (`unfinished_lessons`) и хаб назначений (quizlet + домашние работы).
