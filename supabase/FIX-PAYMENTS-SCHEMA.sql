-- ═══════════════════════════════════════════════════════════════════
-- ПАТЧ: добавить недостающие колонки в таблицу payments
-- Вставить в Supabase → SQL Editor → Run
-- Безопасно запускать повторно (IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS email      text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS name       text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS offer_id   text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount     int;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency   text DEFAULT 'RUB';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS password_hash text;

-- Проверка результата
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments' AND table_schema = 'public'
ORDER BY ordinal_position;
