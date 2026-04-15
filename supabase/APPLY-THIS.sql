-- ═══════════════════════════════════════════════════════════════════════════
-- МЕТОД ЖУРОВА — ФИНАЛЬНАЯ СХЕМА (v3)
-- Вставить ЦЕЛИКОМ в Supabase SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ОЧИСТКА СТАРЫХ ТРИГГЕРОВ (только существующие таблицы)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
DROP TRIGGER IF EXISTS update_diagnostics_updated_at ON public.diagnostics;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS update_ai_chat_history_updated_at ON public.ai_chat_history;
DROP TRIGGER IF EXISTS on_user_profile_updated ON public.user_profiles;

DO $$ BEGIN DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; EXCEPTION WHEN others THEN null; END $$;

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  plan text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
DO $$ BEGIN create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  status text not null default 'inactive',
  plan text,
  current_period_end timestamptz,
  updated_at timestamptz default now(),
  unique (user_id)
);
create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
alter table public.subscriptions enable row level security;
DO $$ BEGIN create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. SYNC EVENTS
create table if not exists public.sync_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete set null,
  client_id text,
  event_type text,
  body jsonb,
  created_at timestamptz default now()
);
create index if not exists sync_events_user_id_idx on public.sync_events (user_id);
alter table public.sync_events enable row level security;
DO $$ BEGIN create policy "sync_events_insert_own" on public.sync_events for insert with check (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN create policy "sync_events_select_own" on public.sync_events for select using (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. CHAT MESSAGES
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
DO $$ BEGIN create policy "chat_messages_select_own" on public.chat_messages for select using (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN create policy "chat_messages_insert_own" on public.chat_messages for insert with check (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN create policy "chat_messages_delete_own" on public.chat_messages for delete using (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 5. COURSE PROGRESS
create table if not exists public.course_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_day int not null default 1,
  completed_days int[] default '{}',
  game_xp int default 0,
  game_streak int default 0,
  snapshot jsonb,
  updated_at timestamptz default now()
);
alter table public.course_progress enable row level security;
DO $$ BEGIN create policy "course_progress_select_own" on public.course_progress for select using (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN create policy "course_progress_upsert_own" on public.course_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 6. PAYMENTS — добавить password_hash
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS password_hash text;

-- 7. USER PROFILES — ensure RLS
alter table public.user_profiles enable row level security;

-- 8. ACCESS TOKENS (промокоды)
CREATE TABLE IF NOT EXISTS public.access_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token text UNIQUE NOT NULL,
  plan text NOT NULL,
  duration_days integer NOT NULL,
  expires_at timestamptz,
  max_uses integer DEFAULT 1,
  used_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;

-- 9. ТРИГГЕР: user_profiles → subscriptions
create or replace function public.sync_user_profile_to_subscriptions()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_user_id uuid; v_plan text;
begin
  select id into v_user_id from auth.users where email = new.email limit 1;
  if v_user_id is null then return new; end if;
  v_plan := case new.subscription_type
    when 'week1' then 'basic' when 'full' then 'full' when 'premium' then 'premium'
    else new.subscription_type end;
  insert into public.subscriptions (user_id, status, plan, current_period_end, updated_at)
  values (v_user_id, new.subscription_status, v_plan, new.subscription_expires_at, now())
  on conflict (user_id) do update set
    status = excluded.status, plan = excluded.plan,
    current_period_end = excluded.current_period_end, updated_at = now();
  return new;
end; $$;

create trigger on_user_profile_updated
  after insert or update on public.user_profiles
  for each row execute function public.sync_user_profile_to_subscriptions();

-- 10. ТРИГГЕР: новый пользователь → profiles + подписка
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_up public.user_profiles%rowtype; v_plan text;
begin
  insert into public.profiles (id, plan) values (new.id, 'free') on conflict (id) do nothing;
  select * into v_up from public.user_profiles where email = new.email limit 1;
  if found and v_up.subscription_status = 'active' then
    v_plan := case v_up.subscription_type
      when 'week1' then 'basic' when 'full' then 'full' when 'premium' then 'premium'
      else coalesce(v_up.subscription_type, 'basic') end;
    insert into public.subscriptions (user_id, status, plan, current_period_end, updated_at)
    values (new.id, 'active', v_plan, v_up.subscription_expires_at, now())
    on conflict (user_id) do update set
      status = 'active', plan = excluded.plan,
      current_period_end = excluded.current_period_end, updated_at = now();
  end if;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══ ГОТОВО ═══
