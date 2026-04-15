-- Схема Supabase для приложения Джаан — 30:30 ПРОТОКОЛ
-- Запускать в Supabase SQL Editor по частям или целиком.
-- Проект: ekdokmixrohhilgypjkm

-- ─── ПРОФИЛИ ─────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  plan text default 'free',        -- 'free' | 'basic' | 'premium'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ─── ПОДПИСКИ ─────────────────────────────────────────────────────────────────
-- Заполняется только сервисной ролью (webhook платёжной системы)

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text,                    -- 'stripe' | 'yukassa' | 'manual'
  provider_customer_id text,
  provider_subscription_id text,
  status text not null default 'inactive',
  plan text,                        -- 'basic' | 'premium'
  current_period_end timestamptz,
  updated_at timestamptz default now(),
  unique (user_id)
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ─── СОБЫТИЯ СИНХРОНИЗАЦИИ ────────────────────────────────────────────────────
-- Диагностика, отчёты, прогресс — пишется с клиента, читается бэкендом

create table if not exists public.sync_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete set null,
  client_id text,
  event_type text,     -- 'diagnostic' | 'report' | 'checkpoint' | 'progress'
  body jsonb,
  created_at timestamptz default now()
);

create index if not exists sync_events_user_id_idx on public.sync_events (user_id);
alter table public.sync_events enable row level security;

create policy "sync_events_insert_own" on public.sync_events
  for insert with check (auth.uid() = user_id);
create policy "sync_events_select_own" on public.sync_events
  for select using (auth.uid() = user_id);

-- ─── ЧАТ С ТРЕНЕРОМ ──────────────────────────────────────────────────────────
-- История диалогов с AI-тренером Джааном

create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists chat_messages_user_id_idx on public.chat_messages (user_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages (created_at);
alter table public.chat_messages enable row level security;

create policy "chat_messages_select_own" on public.chat_messages
  for select using (auth.uid() = user_id);
create policy "chat_messages_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);
create policy "chat_messages_delete_own" on public.chat_messages
  for delete using (auth.uid() = user_id);

-- ─── ПРОГРЕСС КУРСА (облачный снимок) ────────────────────────────────────────

create table if not exists public.course_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_day int not null default 1,
  completed_days int[] default '{}',
  game_xp int default 0,
  game_streak int default 0,
  snapshot jsonb,        -- полный снимок gameState для восстановления
  updated_at timestamptz default now()
);

alter table public.course_progress enable row level security;

create policy "course_progress_select_own" on public.course_progress
  for select using (auth.uid() = user_id);
create policy "course_progress_upsert_own" on public.course_progress
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── ПЛАТЕЖИ (пишет landing через service role) ─────────────────────────────

create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  order_id text unique not null,
  payment_id text,
  email text not null,
  name text,
  offer_id text,
  amount int,                      -- в копейках
  currency text default 'RUB',
  status text default 'pending',   -- pending | succeeded | failed | cancelled
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_email_idx on public.payments (email);
alter table public.payments enable row level security;
-- Только сервисная роль пишет/читает платежи

-- ─── USER PROFILES (email-based, для webhook до регистрации) ─────────────────

create table if not exists public.user_profiles (
  email text primary key,
  subscription_status text default 'inactive',
  subscription_type text,          -- week1 | full | premium
  subscription_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles enable row level security;
-- Только сервисная роль

-- ─── ТРИГГЕР: при активации user_profiles → обновить subscriptions по user_id ─

create or replace function public.sync_user_profile_to_subscriptions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_plan text;
begin
  -- Найти user_id по email в auth.users
  select id into v_user_id from auth.users where email = new.email limit 1;
  if v_user_id is null then return new; end if;

  -- Маппинг offer_id → plan для subscriptions
  v_plan := case new.subscription_type
    when 'week1'   then 'basic'
    when 'full'    then 'full'
    when 'premium' then 'premium'
    else new.subscription_type
  end;

  insert into public.subscriptions (user_id, status, plan, current_period_end, updated_at)
  values (v_user_id, new.subscription_status, v_plan, new.subscription_expires_at, now())
  on conflict (user_id) do update set
    status = excluded.status,
    plan = excluded.plan,
    current_period_end = excluded.current_period_end,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_user_profile_updated on public.user_profiles;
create trigger on_user_profile_updated
  after insert or update on public.user_profiles
  for each row execute function public.sync_user_profile_to_subscriptions();

-- ─── ТРИГГЕР: автосоздание профиля + синхронизация подписки при регистрации ──

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_up public.user_profiles%rowtype;
  v_plan text;
begin
  -- Создаём профиль
  insert into public.profiles (id, plan)
  values (new.id, 'free')
  on conflict (id) do nothing;

  -- Если пользователь уже купил (email в user_profiles) — активируем подписку
  select * into v_up from public.user_profiles where email = new.email limit 1;
  if found and v_up.subscription_status = 'active' then
    v_plan := case v_up.subscription_type
      when 'week1'   then 'basic'
      when 'full'    then 'full'
      when 'premium' then 'premium'
      else coalesce(v_up.subscription_type, 'basic')
    end;

    insert into public.subscriptions (user_id, status, plan, current_period_end, updated_at)
    values (new.id, 'active', v_plan, v_up.subscription_expires_at, now())
    on conflict (user_id) do update set
      status = 'active',
      plan = excluded.plan,
      current_period_end = excluded.current_period_end,
      updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── STORAGE: аудио Джаана ───────────────────────────────────────────────────
-- Запускается ОТДЕЛЬНО если bucket ещё не создан (в Storage UI или SQL ниже)

-- insert into storage.buckets (id, name, public)
-- values ('jaan-audio', 'jaan-audio', true)
-- on conflict (id) do nothing;

-- Политика: читать может любой (public bucket)
-- create policy "jaan_audio_public_read" on storage.objects
--   for select using (bucket_id = 'jaan-audio');

-- Политика: загружать может только сервисная роль (через Supabase Dashboard)
-- Файлы грузим вручную через Dashboard → Storage → jaan-audio
