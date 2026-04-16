# Промпт для реализации: сохранение диагностик, отчётов и чата в Supabase

## Комментарии к промпту (для человека и агента)

- **Зачем это всё:** сейчас правда о прогрессе живёт в `localStorage`, а облако почти пустое без ручной «синхронизации». Нужен один канон в Supabase для аналитики, когорты и ИИ-тренера, без ломания платежей.
- **Часть A (схема):** новые таблицы — канон для отчётов и лендинга; `chat_messages` расширяем колонками, чтобы не плодить вторую таблицу и не ломать текущий `insert` из PWA.
- **Часть B (PWA):** отдельный outbox + немедленный `upsert` при сети и сессии; локальные ключи остаются источником правды офлайн. Legacy `syncQueue`/`sync_events` можно не трогать в первой итерации — он для другой телеметрии.
- **Часть C (лендинг):** квиз `/quiz` — реальная «первичка»; пишем в БД через серверный route с service role, без ключа в браузере.
- **Часть D (`ai-chat`):** привести запросы к тем же именам таблиц, что в PWA, иначе контекст на лендинге всегда пустой.
- **Часть E (приёмка):** ручные проверки после деплоя миграции в Supabase.
- **Часть F:** не раздувать дифф, не светить service role на клиенте, не логировать ПДн.

Скопируй блок ниже в Cursor (режим агента) как **одну задачу**. Код пиши минимальным диффом, с миграциями SQL и RLS. Комментарии в коде — только где неочевидно.

---

## Контекст продукта

Нужно надёжно хранить в Supabase (с **RLS** по `auth.uid()` или связке email → user после регистрации):

1. **Первичная диагностика на лендинге** — до или в процессе воронки оплаты; может быть **до** аккаунта в Auth.
2. **Стартовая диагностика в PWA** — расширенная + PTI после онбординга (`InitialDiagnostics.tsx`, ключ `pwa_v2_profile_initial`).
3. **Ежедневные отчёты** — форма дня (`DayScreen.tsx`, `completeCourseDay` / `markDayComplete`, `DailyReport` в `courseProgress.dailyState[day]`).
4. **Еженедельные (контрольные) отчёты** — экраны чекпоинтов дней 7, 14, 21, 30 (`CheckpointScreen.tsx`, `saveCheckpointResult`, тип `CheckpointDiagnostic` в `courseProgress.ts`).
5. **Сессии с ИИ-тренером** — что спросили, ответ, **номер дня курса на момент сообщения**, время; желательно связка с версией приложения.

Требования:

- **Без обязательной кнопки «Синхронизировать»** у пользователя: при успехе — сразу `upsert`; при офлайне — **очередь outbox** в `localStorage`/IndexedDB и автослив на события `online`, `visibilitychange`/`pageshow`, после `signIn`/`onAuthStateChange`, при старте приложения; ретраи с backoff.
- Локальные данные (`localStorage`) остаются источником правды **офлайн**; облако — **eventual consistency**.
- Единый проект Supabase с PWA и лендингом (те же URL/ключи окружения).
- Не ломать текущий платёжный webhook Тинькофф; отчёты — отдельные таблицы/API.

---

## Часть A. Схема БД (миграция SQL)

Создай файл миграции в `Джаан/supabase/migrations/` (имя с датой). Таблицы (имена можно уточнить, но сохрани смысл):

### A1. `landing_primary_diagnostics`

- Для анкеты **на лендинге до логина**.
- Поля: `id uuid default gen_random_uuid()`, `created_at`, `email text null` (если собрали), `session_id text null` (анонимный id из cookie/localStorage лендинга), `answers jsonb not null`, `offer_interest text null`, `user_agent text null`, `source text default 'landing'`.
- **RLS:** `insert` для `anon` и `authenticated`; `select` только `service_role` **или** владелец после привязки (см. ниже). Практично: insert всем, select только service role + политика «по email владелец видит свои» после добавления колонки `claimed_by_user_id uuid null` и обновления при первом входе с тем же email.

### A2. `app_initial_diagnostics`

- Снимок **`pwa_v2_profile_initial`**: `extended` + `pti`.
- Поля: `user_id uuid references auth.users not null`, `payload jsonb not null`, `completed_at timestamptz default now()`, `schema_version int default 1`.
- **PK** `(user_id)` или уникальный + история версий — на выбор (если нужна история — составной ключ с `completed_at`).

### A3. `daily_reports`

- Поля: `user_id`, `day int` (1–30), `report jsonb` (тот же shape что `DailyReport`), `completed boolean`, `client_updated_at timestamptz`, `server_updated_at timestamptz default now()`.
- **PK** `(user_id, day)`.
- **RLS:** `select/insert/update` только `auth.uid() = user_id`.

### A4. `checkpoint_diagnostics` (еженедельные)

- Поля: `user_id`, `day int` check in (7,14,21,30), `answers jsonb`, `total_average numeric`, `result_level text`, `completed_at timestamptz`.
- **PK** `(user_id, day)`.
- **RLS:** как у `daily_reports`.

### A5. `ai_trainer_messages` (или расширить существующую `chat_messages`)

Сейчас PWA пишет в `public.chat_messages` (`role`, `content`). Нужно **не ломать** клиент:

- Либо **добавить nullable колонки** к `chat_messages`: `course_day int null`, `client_sent_at timestamptz null`, `app_version text null`, `session_id uuid null` (группировка сессии).
- Либо новая таблица `ai_trainer_messages` с FK на `user_id` и дублированием — хуже для двойной записи.

Рекомендация: **ALTER TABLE chat_messages ADD COLUMN** … + бэкофис читает одну таблицу.

При каждом `send()` в `AiTrainer.tsx`: перед/после ответа вставлять строки с `course_day = loadProgress().currentDay` (или явный «день контекста», если решите передавать из UI), `client_sent_at = now()`.

### A6. Индексы

- `(user_id, day)` на отчётах; `(user_id, created_at)` на чате; GIN на jsonb по необходимости позже.

---

## Часть B. Клиент PWA (`Джаан/src`)

### B1. Модуль `lib/reportSync.ts` (или аналог)

- Функции: `queueReportSync(payload)`, `flushReportOutbox()`, использование существующего `getSupabase()` + `getSession()`.
- Очередь: отдельный ключ, например `pwa_v2_sync_outbox_reports`, элементы `{ type, payload, attempts, lastError, createdAt }`.
- Не удалять успешный локальный прогресс при ошибке облака.

### B2. Стартовая диагностика

- Файл: `InitialDiagnostics.tsx` — после `setJSON(KEYS.profileInitial, payload)` вызвать **немедленный** `upsert` в `app_initial_diagnostics` если есть сессия; иначе **enqueue** в outbox.
- При первом появлении сессии (тот же хук/провайдер, что для flush) — отправить накопленное.

### B3. Ежедневные отчёты

- Файлы: `courseProgress.ts` / `DayScreen.tsx` — после успешного `markDayComplete` (или внутри `completeCourseDay` после локального сохранения): **upsert `daily_reports`** с полным `report` json + `day` + `user_id`.
- Дублировать расширенный payload в `enqueueSync` **не обязательно**, если отчёт уже в `daily_reports`; при желании оставь тонкий sync_event для аналитики.

### B4. Еженедельные (чекпоинты)

- Файл: `CheckpointScreen.tsx` / `saveCheckpointResult` — после локального сохранения: **upsert `checkpoint_diagnostics`** + outbox при офлайне.

### B5. ИИ-тренер

- Файл: `AiTrainer.tsx` — при сохранении user-сообщения и assistant-сообщения в Supabase уже есть `insert` в `chat_messages`. Добавить в insert объект метаданных: `course_day`, `app_version` из `import.meta.env` / константы, `client_sent_at`.
- Убедиться, что при офлайне (нет сети) сообщения не теряются: либо очередь для чата, либо хотя бы локально в `KEYS.aiMessages` + повторная попытка insert при `flush` (если insert падал — доработать).

### B6. Триггеры автослива

- В `App.tsx` или корневом layout: подписка на `window.online`, `document.visibilitychange`, `sb.auth.onAuthStateChange` → `flushReportOutbox()`.
- Не спамить: debounce + экспоненциальный backoff для ошибок.

---

## Часть C. Лендинг (`Джаан-landing`)

### C1. Первичная диагностика

- Найти реальный UI «пройти диагностику» (CTA/Hero). Если анкета только заглушка — добавить форму или подключить существующую.
- API route: `POST /api/landing-diagnostics` с **service role** или **anon insert** в `landing_primary_diagnostics` (как настроишь RLS).
- При создании платежа в `create-payment` можно передавать `session_id` или email — связать строки в metadata платежа для отладки.

### C2. Согласованность с PWA

- После регистрации пользователя с тем же email — опциональный скрипт/Edge Function «claim»: проставить `claimed_by_user_id` у строк лендинга (не обязательно в первой итерации).

---

## Часть D. Лендинг `ai-chat` vs PWA

- В `Джаан-landing/app/api/ai-chat/route.ts` используются таблицы `diagnostics`, `reports`, `ai_chat_history` — в PWA-схеме из `schema.sql` их может не быть. Либо **привести имена таблиц к новым** (`app_initial_diagnostics`, `daily_reports`, `chat_messages`), либо создать **views** в Supabase с алиасами. Зафиксируй один канон в коде лендинга и PWA.

---

## Часть E. Приёмка (ручные тесты)

1. Лендинг: отправить первичную диагностику → строка в `landing_primary_diagnostics`.
2. PWA без сети: пройти стартовую диагностику и один день → данные в localStorage + в outbox; включить сеть → строки в `app_initial_diagnostics` и `daily_reports`.
3. Чекпоинт день 7 → строка в `checkpoint_diagnostics`.
4. Чат: два сообщения → в `chat_messages` заполнены `course_day` и метки времени.
5. RLS: второй пользователь не видит чужие строки (проверка в SQL Editor от имени anon с другим JWT).

---

## Часть F. Ограничения

- Не рефакторить несвязанные файлы.
- Не класть service role в клиент.
- ПДн: не логировать полные отчёты в консоль продакшена.

---

## Ссылки на текущий код (точки входа)

- Стартовая диагностика: `Джаан/src/screens/InitialDiagnostics.tsx`
- День: `Джаан/src/screens/DayScreen.tsx`, `Джаан/src/lib/courseProgress.ts`, `Джаан/src/lib/gameState.ts`
- Чекпоинт: `Джаан/src/screens/CheckpointScreen.tsx`, `saveCheckpointResult` в `courseProgress.ts`
- Чат: `Джаан/src/screens/AiTrainer.tsx`, таблица `chat_messages` в `Джаан/supabase/schema.sql`
- Очередь (legacy): `Джаан/src/lib/syncQueue.ts`, `Джаан/src/screens/Profile.tsx` — не удалять сразу; новый outbox может переиспользовать идею или заменить после стабилизации.

---

Конец промпта.
