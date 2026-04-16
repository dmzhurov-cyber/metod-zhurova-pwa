-- Удалить старый check constraint на offer_id
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_offer_id_check;

-- Проверка - constraint должен исчезнуть
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'payments' AND table_schema = 'public';
