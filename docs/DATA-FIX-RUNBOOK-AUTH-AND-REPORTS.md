# Runbook: почему не заполнились данные в Supabase (авторизация · отчёты)

> Статус: расследование по коду репозитория, **без изменения кода**.  
> Дата: 2026-04-16  
> Контекст: после оплаты и регистрации пользователь видит работающее PWA; в БД пусто `user_profiles`, `subscriptions`, `course_progress`, `sync_events` при живых `auth.users`, `profiles`, `payments`.

---

## Как устроены потоки (коротко)

| Данные | Где создаётся / обновляется | Что читает приложение |
|--------|----------------------------|------------------------|
| Вход (email+пароль) | Supabase Auth | `AuthScreen` → `signInWithPassword` |
| Профиль `profiles` | Триггер `handle_new_user` при создании пользователя | RLS-своя строка |
| Оплата `payments` | Лендинг `create-payment` (pending), затем **ожидается** `tinkoff-webhook` (succeeded) | Аналитика / ручные проверки |
| `user_profiles` + цепочка в `subscriptions` | **Только** при успешном webhook: `Джаан-landing/app/api/tinkoff-webhook/route.ts` → `user_profiles.upsert` → триггер `sync_user_profile_to_subscriptions` | `CourseAccessContext` читает `subscriptions` |
| Прогресс курса и отчёты | **Только** `localStorage` ключ `pwa_v2_course_progress` | `loadProgress()` / экран дня |
| Очередь событий в облако | `enqueueSync` → localStorage `pwa_v2_sync_queue` | — |
| Запись в `sync_events` | **Только** `flushSyncQueue()` после входа | Профиль → кнопка синхронизации |
| `course_progress` (таблица) | В коде PWA **нет** `insert`/`upsert` в эту таблицу | Нигде в клиенте не пишется |

Вывод: **отсутствие строк в `course_progress` и `sync_events` — ожидаемо**, если не реализована отдельная синхронизация. **Пустые `user_profiles` / `subscriptions` — аномалия** относительно задуманного платёжного контура.

---

## Раздел 1. Авторизация и оплата

### 1.1 Пошаговая логика (как задумано)

1. Лендинг создаёт платёж в Тинькофф и пишет в `payments` со статусом **`pending`** (`create-payment`).
2. Тинькофф дергает **`/api/tinkoff-webhook`** на задеплоенном лендинге.
3. Webhook находит строку `payments` по `order_id`, ставит **`succeeded`**, делает **`user_profiles` upsert** (email, active, тип подписки, срок).
4. Триггер на `user_profiles` обновляет **`subscriptions`** для пользователя с тем же email в `auth.users` (через `sync_user_profile_to_subscriptions`).
5. Пользователь регистрируется / входит → триггер **`handle_new_user`** создаёт `profiles`; если к этому моменту уже есть активная строка в `user_profiles` по email — подписка подтягивается.

### 1.2 Факт по проверке (пример `dmzhurov@gmail.com`)

- `auth.users` и `profiles` — **есть**.
- `payments` — **есть**, `succeeded`.
- `user_profiles` — **нет**.
- `subscriptions` — **нет**.

### 1.3 Гипотезы, почему так (не меняя код)

**H1. Webhook не вызывался или не дошёл до этого деплоя**

- URL webhook в личном кабинете Тинькофф должен указывать на **тот же** хост, где развёрнут `tinkoff-webhook` (Vercel/Netlify и т.д.).
- Если оплата тестовая / другой терминал / старый URL — статус `succeeded` могли проставить **вручную** или другим скриптом, **минуя** блок с `user_profiles.upsert`.

**H2. Webhook упал до upsert (ошибка Supabase, секреты)**

- В начале маршрута: `createServerClient()`; если `SUPABASE_SERVICE_ROLE_KEY` или URL неверны на **сервере лендинга**, возможен частичный сценарий (в логах Vercel/хостинга).
- Проверка: логи деплоя в момент `succeeded` по `order_id` из `payments`.

**H3. Несовпадение `order_id`**

- Webhook ищет `payments` по `OrderId` из тела уведомления. Если в уведомлении другой идентификатор, сработает ветка «payment not found» — **платёж не обновится из webhook**… но у вас статус уже `succeeded`, значит обновление шло **каким-то** путём (или webhook всё же нашёл строку).

**H4. Порядок «сначала оплата, потом аккаунт»**

- У пользователя платёж по времени **раньше**, чем `created_at` в Auth — это нормально.
- Триггер на `user_profiles` должен создать `subscriptions` **после** появления строки в `user_profiles`, даже если пользователь уже в Auth.
- Если **`user_profiles` так и не появился**, триггер не сработал — корень снова в **H1–H3**.

**H5. Разные проекты Supabase**

- PWA (`VITE_SUPABASE_URL`) и лендинг (`SUPABASE_*` на сервере) должны быть **один и тот же** проект `ekdokmixrohhilgypjkm`. Иначе оплата уйдёт в «другую» базу.

### 1.4 Что проверить руками (SQL в Dashboard)

Замените email при необходимости.

```sql
-- 1) Пользователь
select id, email, created_at from auth.users where email = 'dmzhurov@gmail.com';

-- 2) Платёж
select order_id, status, offer_id, amount, created_at, updated_at
from public.payments where email = 'dmzhurov@gmail.com' order by created_at desc;

-- 3) Цепочка доступа
select * from public.user_profiles where email = 'dmzhurov@gmail.com';
select * from public.subscriptions s
join auth.users u on u.id = s.user_id
where u.email = 'dmzhurov@gmail.com';
```

### 1.5 Исправление данных (ручной backfill, осторожно)

**Только если** бизнес-подтверждено, что оплата легитимна и план известен:

1. Вставить/обновить `user_profiles` для email (как делает webhook: `subscription_status`, `subscription_type`, `subscription_expires_at`).
2. Убедиться, что сработал триггер и появилась строка в `subscriptions` (или вставить в `subscriptions` вручную с тем же `user_id`, что в `auth.users`).
3. В приложении вызвать обновление доступа: перелогин или то, что дергает `refresh()` в `CourseAccessContext` (смена фокуса / перезапуск).

Конкретные значения `plan` / срока должны совпасть с продуктовой матрицей (`offer_id` в `payments`).

---

## Раздел 2. Отчёты и «облако»

### 2.1 Пошаговая логика экрана дня

1. Пользователь заполняет форму отчёта в состоянии React `reportForm`.
2. Нажатие кнопки вызывает `complete()` → `completeCourseDay` → **`markDayComplete`** в `courseProgress.ts`.
3. `markDayComplete` пишет прогресс в **`localStorage`** (`pwa_v2_course_progress`) и вызывает **`enqueueSync({ type: 'progress', payload: { event: 'day_complete', day } })`** — событие попадает в **очередь** `pwa_v2_sync_queue`, **не в Supabase сразу**.
4. Показывается **toast** (`showToast`): текст «День завершён…» или «Отчёт сохранён.».
5. Вызывается **`refreshTimeGate()`** — обновляется доступ по времени без запроса к `subscriptions`.

### 2.2 Когда появятся строки в `sync_events`

- Функция **`flushSyncQueue`** (`syncQueue.ts`) читает очередь и делает `insert` в `sync_events`.
- Она вызывается **только** с экрана **Профиль** — кнопка «синхронизация» (`Profile.tsx`, `sync()`).
- Условия: есть `getSupabase()`, **есть сессия** (`getSession`). Если пользователь **не залогинен**, `flushSyncQueue` **сразу возвращает ok: 0** и очередь **не уменьшается** — события копятся локально.

**Отсюда гипотеза H6:** пользователь завершал дни, но **не открывал Профиль / не нажимал отправку очереди** → в Supabase **0** `sync_events` — **ожидаемо по текущему коду**.

### 2.3 Таблица `course_progress`

- В исходниках PWA **нет** записи в `public.course_progress`.
- **Пустая строка в БД — ожидаемо**; «истина» по курсу сейчас — **localStorage**.

### 2.4 Почему кажется, что «кнопка не сработала» (UX, гипотезы)

**H7. Мало заметная обратная связь**

- После нажатия основная обратная связь — **короткий toast**, а не постоянная плашка «Отчёт сохранён».
- Текст кнопки меняется с **«Завершить день»** на **«Сохранить отчёт»** только после **повторного рендера**; обычно его даёт `refreshTimeGate()`, но если пользователь не смотрит на кнопку/тост — ощущение «ничего не произошло».

**H8. Повторный заход на экран**

- При новом заходе на день данные формы подтягиваются из **`loadProgress().dailyState[day].reportData`** (`useEffect` по `day`). Если localStorage чистился / другой браузер — форма пустая, хотя пользователь «нажимал» в другом профиле.

**H9. Нажали не ту кнопку / не полный сценарий**

- Кнопка одна; но если закрыли приложение до записи в storage (крайне редко) — теоретически гонка; на практике чаще **H6–H8**.

### 2.5 Что проверить без кода

1. **Тот же браузер**, что при заполнении: F12 → Application → Local Storage → ключ **`pwa_v2_course_progress`** — должен быть JSON с `completedDays` и `dailyState` с отчётами.
2. Длина очереди: ключ **`pwa_v2_sync_queue`** (массив событий). Если не пустой и пользователь залогинен — зайти в **Профиль** и нажать отправку синхронизации; после этого в SQL:

```sql
select count(*) from public.sync_events where user_id = '<uuid из auth.users>';
```

### 2.6 Исправление / восстановление отчётов в БД

Сейчас **нет** канонической таблицы «отчёт за день» в Supabase в этом клиенте. Варианты на уровне продукта:

1. **Не трогать** — считать отчёты локальными до появления фичи синка.
2. **Разовый импорт**: из экспорта localStorage (ручной JSON) — скрипт с service role пишет в будущую таблицу или в `sync_events.body` (если решите хранить там полный снимок) — **только по процедуре и согласию**.

---

## Сводная таблица «ожидаемо / нет»

| Таблица / симптом | Ожидаемо при текущем коде? |
|-------------------|----------------------------|
| `sync_events` = 0, если не жали синк в профиле | **Да** |
| `course_progress` пусто | **Да** (не пишется из PWA) |
| `payments` = succeeded | **Да** после успешной оплаты / обновления |
| `user_profiles` пусто при succeeded | **Нет** (если webhook тот же проект и дошёл) |
| `subscriptions` пусто | **Следствие** от пустого `user_profiles` или отсутствия триггера |

---

## Что смотреть в логах (следующий шаг расследования)

1. **Хостинг лендинга** (момент оплаты по `order_id` из `payments`): вызывался ли `POST /api/tinkoff-webhook`, был ли 200, не было ли `payment not found` / ошибки Supabase.
2. **Тинькофф**: статус уведомлений по этому `OrderId`.
3. **Совпадение** `NEXT_PUBLIC_*` / `SUPABASE_*` между лендингом и PWA.

---

## Связанные файлы (для разработчика)

- Очередь и flush: `Джаан/src/lib/syncQueue.ts`, `Джаан/src/screens/Profile.tsx`
- Завершение дня: `Джаан/src/lib/courseProgress.ts`, `Джаан/src/lib/gameState.ts`, `Джаан/src/screens/DayScreen.tsx`
- Webhook: `Джаан-landing/app/api/tinkoff-webhook/route.ts`
- Создание платежа: `Джаан-landing/app/api/create-payment/route.ts`
- Доступ по подписке: `Джаан/src/context/CourseAccessContext.tsx`
- Схема и триггеры: `Джаан/supabase/schema.sql`
