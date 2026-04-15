/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Макс. номер дня курса, доступный в билде (1–30). Пусто = все 30 дней. Для «неделя 1» задайте 7. */
  readonly VITE_MAX_UNLOCKED_DAY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
