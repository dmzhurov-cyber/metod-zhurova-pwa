-- ================================================
-- ПРОМОКОДЫ — Метод Журова
-- Выполнить в Supabase Dashboard → SQL Editor
-- ================================================

-- 1. Тестовый промокод для разработчика (безлимитный, premium, 365 дней)
INSERT INTO public.access_tokens (token, plan, duration_days, expires_at, max_uses, used_count)
VALUES ('JAAN-DEV-2026', 'premium', 365, '2027-12-31T23:59:59Z', 100, 0)
ON CONFLICT (token) DO NOTHING;

-- 2. Промокод для Frisky Alpha тестеров (30 дней, plan=full, до 50 использований)
INSERT INTO public.access_tokens (token, plan, duration_days, expires_at, max_uses, used_count)
VALUES ('FRISKY-ALPHA', 'full', 30, '2026-12-31T23:59:59Z', 50, 0)
ON CONFLICT (token) DO NOTHING;

-- 3. Персональные промокоды (по 1 использованию каждый)
INSERT INTO public.access_tokens (token, plan, duration_days, expires_at, max_uses, used_count) VALUES
  ('MZH-GIFT-001', 'full', 30, '2026-12-31T23:59:59Z', 1, 0),
  ('MZH-GIFT-002', 'full', 30, '2026-12-31T23:59:59Z', 1, 0),
  ('MZH-GIFT-003', 'full', 30, '2026-12-31T23:59:59Z', 1, 0),
  ('MZH-GIFT-004', 'full', 30, '2026-12-31T23:59:59Z', 1, 0),
  ('MZH-GIFT-005', 'full', 30, '2026-12-31T23:59:59Z', 1, 0)
ON CONFLICT (token) DO NOTHING;

-- ================================================
-- ПРОВЕРИТЬ ТЕСТОВЫЙ АККАУНТ jaan@metod-zhurova.ru
-- ================================================

-- Убедиться что подписка активна для тестового аккаунта.
-- Если аккаунт создан через Supabase Auth, найдём user_id:
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'jaan@metod-zhurova.ru' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Пользователь jaan@metod-zhurova.ru НЕ НАЙДЕН в auth.users. Создайте его через Supabase Dashboard → Authentication → Add user.';
  ELSE
    RAISE NOTICE 'Найден user_id: %', v_user_id;
    
    -- Создаём/обновляем подписку
    INSERT INTO public.subscriptions (user_id, plan, status, expires_at, updated_at)
    VALUES (v_user_id, 'premium', 'active', '2030-12-31T23:59:59Z', now())
    ON CONFLICT (user_id) DO UPDATE SET
      plan = 'premium',
      status = 'active',
      expires_at = '2030-12-31T23:59:59Z',
      updated_at = now();
    
    RAISE NOTICE 'Подписка premium/active до 2030 — установлена для %', v_user_id;
  END IF;
END $$;

-- Проверка результата:
SELECT u.email, s.plan, s.status, s.expires_at
FROM public.subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'jaan@metod-zhurova.ru';
