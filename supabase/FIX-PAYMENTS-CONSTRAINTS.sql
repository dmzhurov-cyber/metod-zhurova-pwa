-- ═══════════════════════════════════════════════════════════════════
-- ПАТЧ: убрать все NOT NULL constraints в payments
-- Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.payments ALTER COLUMN offer_id          DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN payment_provider  DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN user_id           DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN amount            DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN currency          DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN payment_id        DROP NOT NULL;

-- Проверка: все колонки должны быть YES в is_nullable
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments' AND table_schema = 'public'
ORDER BY ordinal_position;
