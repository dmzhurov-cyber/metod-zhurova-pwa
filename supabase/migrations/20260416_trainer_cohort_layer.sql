-- Слой данных для ИИ-тренера: анонимная когорта + согласие на участие в агрегатах
-- Применять в Supabase SQL Editor или через CLI миграций.
-- Документация: 3030-project/content/ai-trainer/PLAN-TRAINER-DATA-AND-COHORT-LEARNING.md

-- ─── Согласие пользователя (опционально для ETL) ────────────────────────────

create table if not exists public.user_analytics_consent (
  user_id uuid primary key references auth.users (id) on delete cascade,
  contribute_to_cohort_stats boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_analytics_consent enable row level security;

create policy "user_analytics_consent_select_own"
  on public.user_analytics_consent for select
  using (auth.uid() = user_id);

create policy "user_analytics_consent_upsert_own"
  on public.user_analytics_consent for insert
  with check (auth.uid() = user_id);

create policy "user_analytics_consent_update_own"
  on public.user_analytics_consent for update
  using (auth.uid() = user_id);

-- ─── Агрегаты по когорте (только service role пишет; клиент только читает) ──

create table if not exists public.trainer_cohort_stats (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  stats jsonb not null default '{}'::jsonb,
  sample_size int not null default 0,
  created_at timestamptz not null default now(),
  unique (period_start, period_end)
);

create index if not exists trainer_cohort_stats_period_end_idx
  on public.trainer_cohort_stats (period_end desc);

alter table public.trainer_cohort_stats enable row level security;

-- Любой залогиненный может читать уже обезличенные агрегаты (для подмешивания в промпт)
create policy "trainer_cohort_stats_select_authenticated"
  on public.trainer_cohort_stats for select to authenticated
  using (true);

-- Пользователям запрещено вставлять/менять агрегаты
-- (запись через service_role обходит RLS)

comment on table public.trainer_cohort_stats is 'Анонимные агрегаты для ИИ-тренера; заполнять только бэкендом/ETL';
comment on table public.user_analytics_consent is 'Согласие на использование данных в когортных агрегатах';
