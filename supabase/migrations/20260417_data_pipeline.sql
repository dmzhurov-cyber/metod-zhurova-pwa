-- Пайплайн: лендинг-диагностика, стартовая PWA, дневные/контрольные отчёты, метаданные чата

-- ─── A1. Первичная диагностика с лендинга (до Auth) ───────────────────────────

create table if not exists public.landing_primary_diagnostics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text,
  session_id text,
  answers jsonb not null,
  offer_interest text,
  user_agent text,
  source text not null default 'landing',
  claimed_by_user_id uuid references auth.users (id) on delete set null
);

create index if not exists landing_primary_diagnostics_session_id_idx
  on public.landing_primary_diagnostics (session_id);
create index if not exists landing_primary_diagnostics_created_at_idx
  on public.landing_primary_diagnostics (created_at);

alter table public.landing_primary_diagnostics enable row level security;

DO $$ BEGIN
  create policy "landing_primary_diagnostics_insert_anon"
    on public.landing_primary_diagnostics for insert to anon with check (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "landing_primary_diagnostics_insert_authenticated"
    on public.landing_primary_diagnostics for insert to authenticated with check (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "landing_primary_diagnostics_select_own"
    on public.landing_primary_diagnostics for select to authenticated using (
      claimed_by_user_id = auth.uid()
      or (
        email is not null
        and exists (
          select 1 from auth.users u
          where u.id = auth.uid() and lower(u.email) = lower(landing_primary_diagnostics.email)
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── A2. Стартовая диагностика PWA ───────────────────────────────────────────

create table if not exists public.app_initial_diagnostics (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  completed_at timestamptz not null default now(),
  schema_version int not null default 1
);

alter table public.app_initial_diagnostics enable row level security;

DO $$ BEGIN
  create policy "app_initial_diagnostics_select_own"
    on public.app_initial_diagnostics for select using (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "app_initial_diagnostics_insert_own"
    on public.app_initial_diagnostics for insert with check (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "app_initial_diagnostics_update_own"
    on public.app_initial_diagnostics for update using (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── A3. Ежедневные отчёты ───────────────────────────────────────────────────

create table if not exists public.daily_reports (
  user_id uuid not null references auth.users (id) on delete cascade,
  day int not null check (day >= 1 and day <= 30),
  report jsonb not null default '{}'::jsonb,
  completed boolean not null default true,
  client_updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists daily_reports_user_day_idx on public.daily_reports (user_id, day);

alter table public.daily_reports enable row level security;

DO $$ BEGIN
  create policy "daily_reports_select_own"
    on public.daily_reports for select using (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "daily_reports_insert_own"
    on public.daily_reports for insert with check (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "daily_reports_update_own"
    on public.daily_reports for update using (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── A4. Контрольные (еженедельные) ──────────────────────────────────────────

create table if not exists public.checkpoint_diagnostics (
  user_id uuid not null references auth.users (id) on delete cascade,
  day int not null check (day in (7, 14, 21, 30)),
  answers jsonb not null default '{}'::jsonb,
  total_average numeric,
  result_level text,
  completed_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.checkpoint_diagnostics enable row level security;

DO $$ BEGIN
  create policy "checkpoint_diagnostics_select_own"
    on public.checkpoint_diagnostics for select using (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "checkpoint_diagnostics_insert_own"
    on public.checkpoint_diagnostics for insert with check (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "checkpoint_diagnostics_update_own"
    on public.checkpoint_diagnostics for update using (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── A5. Расширение chat_messages ───────────────────────────────────────────

alter table public.chat_messages add column if not exists course_day int;
alter table public.chat_messages add column if not exists client_sent_at timestamptz;
alter table public.chat_messages add column if not exists app_version text;
alter table public.chat_messages add column if not exists session_id uuid;
