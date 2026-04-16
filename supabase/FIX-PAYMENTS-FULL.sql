-- ═══════════════════════════════════════════════════════════════════
-- ПОЛНЫЙ ПАТЧ ТАБЛИЦЫ PAYMENTS
-- Вставить в Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- Добавляем все недостающие колонки
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS order_id      text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS email         text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS name          text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS offer_id      text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount        bigint;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency      text DEFAULT 'RUB';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status        text DEFAULT 'pending';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS metadata      jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at    timestamptz DEFAULT now();
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_at    timestamptz DEFAULT now();

-- Уникальный индекс на order_id (нужен для upsert onConflict)
CREATE UNIQUE INDEX IF NOT EXISTS payments_order_id_key ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS payments_email_idx ON public.payments (email);

-- Проверка — покажет все колонки
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments' AND table_schema = 'public'
ORDER BY ordinal_position;
