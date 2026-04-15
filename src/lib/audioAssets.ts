/**
 * Все голосовые файлы Джаана в одном месте.
 *
 * КАК ДОБАВИТЬ АУДИО:
 * 1. Запиши голос (телефон / online-voice-recorder.com)
 * 2. Загрузи файл в Supabase Storage → bucket "jaan-audio" → Public
 * 3. Скопируй Public URL (выглядит как https://ekdokmixrohhilgypjkm.supabase.co/storage/v1/object/public/jaan-audio/...)
 * 4. Вставь URL в соответствующее поле ниже
 * 5. Задеплой на Netlify (или просто сохрани — при следующем deploy подтянется)
 *
 * Если URL не задан (null) — плеер не показывается. Текст остаётся.
 */

export const AUDIO = {
  // ─── Онбординг ───────────────────────────────────────────────────────────

  /** Шаг 1: "Привет. Я — Джаан." — первые слова при входе */
  onboarding_welcome: null as string | null,
  // Пример: 'https://ekdokmixrohhilgypjkm.supabase.co/storage/v1/object/public/jaan-audio/onboarding_welcome.mp3'

  /** Шаг 2: "Что тебя ждёт" — про путь и методику */
  onboarding_path: null as string | null,

  /** Шаг 6: "Начнём с диагностики" — перед первыми вопросами */
  onboarding_before_diagnostics: null as string | null,

  // ─── Главный экран ───────────────────────────────────────────────────────

  /** Ежедневное приветствие (одно на все дни, или можно по дням) */
  home_daily_greeting: null as string | null,

  // ─── Дни курса ───────────────────────────────────────────────────────────

  /** Вводное слово к каждому дню. Ключ: номер дня (1–30) */
  day_intro: {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
    9: null,
    10: null,
    11: null,
    12: null,
    13: null,
    14: null,
    15: null,
    16: null,
    17: null,
    18: null,
    19: null,
    20: null,
    21: null,
    22: null,
    23: null,
    24: null,
    25: null,
    26: null,
    27: null,
    28: null,
    29: null,
    30: null,
  } as Record<number, string | null>,

  // ─── Контрольные точки ───────────────────────────────────────────────────

  /** После завершения недели — слово поддержки */
  checkpoint_week1: null as string | null,
  checkpoint_week2: null as string | null,
  checkpoint_week3: null as string | null,
  checkpoint_final: null as string | null,

  // ─── AI-тренер ───────────────────────────────────────────────────────────

  /** Приветственное аудио при первом открытии чата */
  ai_trainer_welcome: null as string | null,

  // ─── Вводные модули (IntroDayScreen) ─────────────────────────────────────

  /** Аудио к вводному модулю 1: "Откуда это взялось" — история Джаана */
  intro_1: null as string | null,

  /** Аудио к вводному модулю 2: "Как устроен мой метод" — философия */
  intro_2: null as string | null,

  /** Аудио к вводному модулю 3: "Что тебя ждёт" — карта курса */
  intro_3: null as string | null,

  // ─── Сказки — голосовые рассказы Джаана ──────────────────────────────────
  //   Аудиоформат: история/метафора/практика. Загрузить через upload-audio.mjs
  //   Ключи: story_01 … story_10 (добавляй по мере записи)

  stories: {
    story_01: null as string | null, // Пример: "Про банку и волну"
    story_02: null as string | null, // Пример: "Про тишину между ударами"
    story_03: null as string | null,
    story_04: null as string | null,
    story_05: null as string | null,
    story_06: null as string | null,
    story_07: null as string | null,
    story_08: null as string | null,
    story_09: null as string | null,
    story_10: null as string | null,
  } as Record<string, string | null>,
} as const
