# 30:30 ПРОТОКОЛ — PWA v2

Новая кодовая база по [PWA-V2-MASTER-SPEC.md](../PWA-V2-MASTER-SPEC.md).

## Стек

**React 19 + TypeScript + Vite 8** — зрелая экосистема PWA (`vite-plugin-pwa`), удобное разбиение на экраны и данные, предсказуемый роутинг (`react-router`), типизация контента и диагностик.

## Команды

| Команда | Назначение |
|--------|------------|
| `npm run dev` | Локальная разработка (базовый путь `/`) |
| `npm run build` | Production-сборка с `base: /pwa-appfinal/` |
| `npm run pack:netlify` | После `build`: папка `for-netlify-drop/` для Netlify Drop |
| `npm run preview` | Просмотр `dist` |
| `npm run extract:legacy` | Пересборка `src/course/legacy/courseData.js` из монолита `pwa-appfinal/index.html` (диапазоны строк в `scripts/extract-legacy-html.mjs`; при правках монолита скрипт может потребовать обновления) |

## Деплой (Netlify Drop)

1. `npm run build && npm run pack:netlify`
2. Загрузите **содержимое** каталога `for-netlify-drop/` в Netlify Drop (как в эталоне `pwa-appfinal/for-netlify-drop`).
3. В корне пакета: `netlify.toml`, редирект `/` → `/pwa-appfinal/`, статика приложения в `pwa-appfinal/`.

Переменные окружения для продакшена задайте в Netlify UI: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (см. `.env.example`). Пересборка нужна после смены переменных.

**Гейтинг дней (клиент):** `VITE_MAX_UNLOCKED_DAY` — максимальный номер дня курса, доступный в билде (`1`…`30`). Пусто или `30` — все дни открыты (как в разработке). Для продажи только первой недели задайте `7` (или `10`). Маршруты `/app/day/:n` и `/app/checkpoint/:n` показывают экран «пока недоступен», если `n` выше лимита. Это не замена серверной проверки подписки.

В `public/version.json` — версия деплоя; `src/lib/appVersion.ts` и `package.json` должны совпадать по смыслу. Баннер в приложении сравнивает локальную версию с `version.json` (жёсткое обновление при `minSupported` выше клиента).

SQL-черновик для Supabase: `supabase/schema.sql` (таблицы `profiles`, `subscriptions`, `sync_events`, RLS, триггер профиля). Выполните в SQL Editor проекта; в **Authentication → URL Configuration** добавьте redirect для magic link: `https://<ваш-хост>/pwa-appfinal/app/profile` (и `http://localhost:5173/app/profile` для dev).

Отправка очереди синхронизации на сервер **только после входа** по email (см. блок «Аккаунт» в профиле) — иначе события остаются локально.

**Доступ к дням:** контекст `CourseAccessProvider` (`src/context/CourseAccessContext.tsx`) объединяет лимит из `VITE_MAX_UNLOCKED_DAY` и строку `subscriptions` в Supabase (планы `full` → 30 дней, `week1` → 7), если пользователь вошёл и подписка `active`/`trialing`. Таблица должна существовать (см. `supabase/schema.sql`).

## Реализовано (MVP)

- Дизайн-система **Submerged Precision** (токены в `src/index.css`).
- **Онбординг установки PWA** без нижней панели и без переключения темы (`/install`).
- Подряд **расширенная диагностика** (19 вопросов, без вопроса про «контроль с начала курса») и **PTI** (`/diagnostics/initial`), единый визуальный паттерн.
- Нижняя навигация на **5 вкладок**: Главная · Библиотека · Прогресс · ИИ-тренер · Профиль.
- Переключение темы — только в **Профиле**.
- **Курс 30 дней**: теория, практика, отчёты и библиотека перенесены из эталона `pwa-appfinal` (`src/course/legacy/courseData.js`, статика `public/course-assets/schemes/` и `illustrations/`). Дни: `/app/day/:day`.
- **Контрольные диагностики** (дни 7, 21, 30): вопросы из `src/data/diagnostics.ts` (`controlCheckpointQuestions`), маршрут `/app/checkpoint/:day`.
- Заглушка **ИИ-тренера**.
- **Supabase** (опционально): клиент `src/lib/supabase.ts`, очередь `src/lib/syncQueue.ts` (отправка из профиля).
- Без интеграции с Telegram.
- **Гейтинг дней** по переменной `VITE_MAX_UNLOCKED_DAY` (роуты дня и контрольной диагностики, см. выше).

## Очередь синхронизации и Supabase

Опциональная таблица для событий (пример; подправьте под свой проект):

```sql
create table if not exists public.sync_events (
  id uuid default gen_random_uuid() primary key,
  client_id text,
  event_type text,
  body jsonb,
  created_at timestamptz default now()
);
```

Включите RLS и политики по своей модели безопасности.

## Сброс локального прохождения (тест)

В консоли браузера:

```js
localStorage.removeItem('pwa_v2_install_onboarding_done')
localStorage.removeItem('pwa_v2_initial_diagnostics_done')
location.reload()
```
