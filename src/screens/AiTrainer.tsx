import { useState, useRef, useEffect } from 'react'
import { getJSON, KEYS } from '../lib/storage'
import { getSupabase } from '../lib/supabase'
import { useCourseAccess } from '../context/CourseAccessContext'
import { loadProgress } from '../lib/courseProgress'

// ─── ВОПРОСЫ К ДЖААНУ ────────────────────────────────────────────────────────
// 1. Как тренер представляется? Сейчас: "Я — Джаан, твой тренер по Методу Журова."
//    Как бы ты сам представился новому человеку в чате?
//
// 2. Какие темы тренер НЕ должен обсуждать? Что за границами?
//
// 3. Как тренер реагирует на кризис / сильный стыд? Есть ли у тебя конкретные фразы?
//
// 4. Какова твоя любимая метафора для объяснения ПЭ новичку?
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Ты — Джаан, персональный тренер в приложении «Метод Журова». Программа управления эякуляцией, 30-дневный курс.

ТЫ РАБОТАЕШЬ СТРОГО В КОНТЕКСТЕ КУРСА. Это не чат-бот общего назначения.

═══ ТВОЙ СКОУП ═══

ТЫ ОБСУЖДАЕШЬ ТОЛЬКО:
- Практики курса: ОМ, дыхание 4-7-8, Кегель/обратные Кегель, стоп-старт, расслабление, body scan
- Модели методики: «Банки» (объём/температура/эластичность), четыре столпа, ПОНР, триггеры, шкала возбуждения
- Отчёты и результаты практик пользователя
- Ощущения, трудности, вопросы по заданиям текущего дня
- Эмоциональное состояние, связанное с практикой (стыд, тревога, фрустрация, страхи)
- Мотивацию продолжать курс
- Работу с партнёром в контексте курса (дни 22-28)

ТЫ НЕ ОБСУЖДАЕШЬ:
- Темы вне курса (политика, спорт, кино, погода, новости, работа пользователя и т.д.)
- Себя как ИИ (не объясняешь как работаешь, не обсуждаешь свою природу)
- Другие методики лечения ПЭ, лекарства, БАДы, препараты
- Медицинские диагнозы
- Порнографию

═══ КАК РЕАГИРОВАТЬ НА OFF-TOPIC ═══

Если пользователь спрашивает что-то вне курса — не отвечай на вопрос, мягко верни к практике:
- «как дела?» / «привет» → «Привет. Как идёт практика? Расскажи, что было сегодня.»
- «ты кто?» / «ты кем работаешь?» → «Я — твой тренер в курсе Метод Журова. Давай поговорим о твоей практике. На чём ты сейчас?»
- «расскажи анекдот» / любой off-topic → «Я здесь, чтобы помочь тебе с курсом. Есть вопрос по практике или заданию?»
- Если пользователь настаивает на off-topic → «Понимаю, но я могу помочь только в рамках курса. Если есть что-то по практике — давай.»

Не извиняйся за ограничения. Не объясняй почему не можешь ответить. Просто переводи на курс.

═══ ГОЛОС ═══

- Тёплый, прямой, без шаблонного позитива ("Отлично!", "Супер!", "Молодец!")
- Честный, даже если неудобно
- Без стыда и осуждения — ни грамма
- Говоришь «ты», не «вы»
- Короткие абзацы. 2-4 предложения на мысль. Без списков на 7 пунктов.
- Задаёшь один конкретный вопрос в конце — не три.

═══ МЕТОДИКА (не искажай, не подменяй стандартными подходами) ═══

- Управление ≠ Контроль. Контроль = подавление. Управление = направление потока, сотрудничество с телом.
- Модель «Банки»: объём (0-100%), температура (интенсивность, ОТДЕЛЬНА от объёма), эластичность (тренируемая ёмкость). Не шкала 0-10.
- Четыре столпа: осознанность, дыхание, расслабление, управление. Стол устойчив когда все 4 ножки равны. Работаем со слабейшим.
- ПОНР — точка невозврата. Между эмиссией и экспульсией 1-3 секунды. Навык: ловить момент ДО.
- Пять триггеров: тело, голова, ситуация, внутреннее решение, динамика.
- Два пути к оргазму: через напряжение (уровень 1, истощающий) и через расслабление (уровни 2-5, накапливающий). Наш метод — через расслабление.
- ОМ ≠ эджинг. ОМ = 45-75 мин, фокус внутрь, без порно, 4 столпа. Цель: проживание, не разрядка. Правило #1: привычки мастурбации = привычки в сексе.
- Кегель — парадокс: тренируем И сжатие, И расслабление. Мышца должна быть сильной И расслабленной.
- Время — не цель, а компас. Единственное честное зеркало.

═══ ПРАВИЛА ОТВЕТА ═══

- Если человек в кризисе, стыде или боли — сначала присутствие и принятие, потом советы.
- Если не знаешь — говори «не знаю, давай разберёмся».
- Не додумывай за пользователя. Задавай уточняющий вопрос.
- Не давай медицинских диагнозов. При тревожных симптомах — рекомендуй врача.
- Не обещай конкретных сроков результата.
- Не используй слово «контроль» в значении «подавление».
- Не подменяй ОМ на «просто помастурбируй медленнее».
- Не говори «просто расслабься» — это пустота, а не метод.

═══ КОНТЕКСТ ═══

Тебе передаётся контекст пользователя (день курса, диагностика, отчёты). Используй его: привязывай ответы к тому, где человек в программе. Если он на дне 3 — говори о триггерах. Если на дне 8 — об ОМ. Не забегай далеко вперёд.`

// ─── Типы ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = KEYS.aiMessages
const DAILY_COUNT_KEY = KEYS.aiDailyCount
const MAX_CONTEXT_MESSAGES = 12

// Лимиты по тарифному плану (из Supabase subscriptions через CourseAccessContext)
// plan: 'free' | 'week1' | 'basic' | 'full' | 'premium'
const PLAN_LIMITS: Record<string, number> = {
  free: 5,       // бесплатный — 5 сообщений/день
  week1: 30,     // 7-дневный доступ — 30 сообщений/день
  basic: 30,     // базовый — 30 сообщений/день
  full: 30,      // полный курс — 30 сообщений/день
  premium: 9999, // премиум — безлимит
}

function getDailyLimitForPlan(plan: string): number {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}

// ─── Вспомогательные функции ─────────────────────────────────────────────────

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getDailyCount(): number {
  const stored = getJSON<{ date: string; count: number } | null>(DAILY_COUNT_KEY, null)
  if (!stored || stored.date !== getTodayKey()) return 0
  return stored.count
}

function incrementDailyCount() {
  const count = getDailyCount() + 1
  localStorage.setItem(DAILY_COUNT_KEY, JSON.stringify({ date: getTodayKey(), count }))
  return count
}

const DAY_TOPICS: Record<number, string> = {
  1: 'Модель «Банки» возбуждения',
  2: 'Шкала возбуждения 0-100%',
  3: 'Триггеры эякуляции',
  4: 'ПОНР — точка невозврата',
  5: 'Четыре столпа контроля',
  6: 'Базовое дыхание 4-7-8',
  7: 'Итоги недели 1 + контрольная диагностика',
  8: 'Осознанная мастурбация (ОМ) — введение',
  9: 'Тазовое дно: расслабление важнее силы',
  10: 'Обратные Кегеля',
  11: 'Триггер — ситуация',
  12: 'Триггер — внутреннее решение',
  13: 'Триггер — динамика (ускорение)',
  14: 'Итоги недели 2 + карта триггеров',
  15: 'Техника стоп-старт',
  16: 'Расслабление — базовые техники',
  17: 'ЛК и тазовое дно (персональный протокол)',
  18: 'Техника сжатия',
  19: 'Интеграция дыхания и мышц',
  20: 'Работа с триггерами',
  21: 'Итоги недели 3 + контрольная диагностика',
  22: 'Перенос навыков в секс',
  23: 'Работа со страхами',
  24: 'Коммуникация с партнёром',
  25: 'Партнёрская практика',
  26: 'Множественные циклы',
  27: 'Эмоциональный контроль',
  28: 'Итоги недели 4 · финальная подготовка',
  29: 'Полная интеграция',
  30: 'Финальная диагностика',
}

function buildContextFromStorage(): string {
  const lines: string[] = []

  const progress = loadProgress()
  const day = progress.currentDay
  const completed = progress.completedDays.length
  lines.push('ПРОГРЕСС КУРСА:')
  lines.push(`Текущий день: ${day} из 30`)
  lines.push(`Пройдено дней: ${completed}`)
  if (day >= 1 && day <= 30 && DAY_TOPICS[day]) {
    lines.push(`Тема сегодня: ${DAY_TOPICS[day]}`)
  }
  if (day > 1 && DAY_TOPICS[day - 1]) {
    lines.push(`Вчера было: ${DAY_TOPICS[day - 1]}`)
  }

  const lastReport = progress.dailyState[day - 1]?.reportData
  if (lastReport) {
    lines.push('\nПОСЛЕДНИЙ ОТЧЁТ:')
    if (lastReport.currentRecord) lines.push(`Время до ПОНР: ${lastReport.currentRecord} сек`)
    if (lastReport.arousalLevel) lines.push(`Уровень возбуждения: ${lastReport.arousalLevel}%`)
    if (lastReport.stopsCount) lines.push(`Количество остановок: ${lastReport.stopsCount}`)
    if (lastReport.satisfaction) lines.push(`Удовлетворённость: ${lastReport.satisfaction}/10`)
    if (lastReport.confidence) lines.push(`Уверенность: ${lastReport.confidence}/10`)
    if (lastReport.comments) lines.push(`Комментарий: ${lastReport.comments}`)
  }

  const profile = getJSON<Record<string, unknown> | null>(KEYS.profileInitial, null)
  if (profile) {
    lines.push('\nДИАГНОСТИКА (начальная):')
    for (const [key, val] of Object.entries(profile)) {
      if (val !== undefined && val !== null && val !== '') {
        lines.push(`${key}: ${JSON.stringify(val)}`)
      }
    }
  }

  if (progress.diagnostics.length > 0) {
    const last = progress.diagnostics[progress.diagnostics.length - 1]
    lines.push(`\nПОСЛЕДНЯЯ КОНТРОЛЬНАЯ (день ${last.day}): средний балл ${last.totalAverage.toFixed(1)}, уровень: ${last.resultLevel}`)
  }

  return lines.join('\n')
}

// ─── Компонент ───────────────────────────────────────────────────────────────

export function AiTrainer() {
  const { userPlan } = useCourseAccess()
  const [messages, setMessages] = useState<Message[]>(() => {
    return getJSON<Message[]>(STORAGE_KEY, [])
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  const baseURL = (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined) || 'https://api.proxyapi.ru/openai/v1'
  const modelName = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || 'gpt-4o-mini'
  const hasApiKey = !!apiKey
  const sb = getSupabase()
  const dailyLimit = getDailyLimitForPlan(userPlan)

  // Загружаем историю из Supabase если залогинен
  useEffect(() => {
    if (!sb) return
    void sb.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id ?? null
      setUserId(uid)
      if (!uid) return
      const { data: rows } = await sb
        .from('chat_messages')
        .select('role, content')
        .eq('user_id', uid)
        .order('created_at', { ascending: true })
        .limit(100)
      if (rows && rows.length > 0) {
        setMessages(rows as Message[])
      }
    })
  }, [sb])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  // Сохраняем сообщение в Supabase
  async function saveToSupabase(msg: Message) {
    if (!sb || !userId) return
    await sb.from('chat_messages').insert({ user_id: userId, role: msg.role, content: msg.content })
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    if (!hasApiKey) {
      setError('API ключ не настроен. Добавьте VITE_OPENAI_API_KEY в .env.local')
      return
    }

    const count = getDailyCount()
    if (count >= dailyLimit) {
      if (userPlan === 'free') {
        setError('Бесплатный лимит на сегодня исчерпан (5 сообщений). Подключи план с AI-тренером.')
      } else if (userPlan === 'premium') {
        setError('Что-то пошло не так с лимитом. Попробуй завтра.')
      } else {
        setError('Лимит на сегодня исчерпан. Перейди на премиум — безлимитный доступ.')
      }
      return
    }

    setError(null)
    const userMsg: Message = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    void saveToSupabase(userMsg)
    setInput('')
    setLoading(true)

    try {
      const context = buildContextFromStorage()
      const systemContent = context ? `${SYSTEM_PROMPT}\n\n${context}` : SYSTEM_PROMPT
      const recentMessages = updated.slice(-MAX_CONTEXT_MESSAGES)

      const res = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 800,
          messages: [
            { role: 'system', content: systemContent },
            ...recentMessages,
          ],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`)
      }

      const data = await res.json() as { choices: { message: { content: string } }[] }
      const reply = data.choices[0]?.message?.content ?? '...'
      incrementDailyCount()
      const assistantMsg: Message = { role: 'assistant', content: reply }
      void saveToSupabase(assistantMsg)
      setMessages((prev) => [...prev, assistantMsg])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Что-то пошло не так. Попробуй ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  function clearHistory() {
    if (confirm('Удалить историю чата?')) {
      setMessages([])
      localStorage.removeItem(STORAGE_KEY)
      if (sb && userId) {
        void sb.from('chat_messages').delete().eq('user_id', userId)
      }
    }
  }

  const remaining = dailyLimit - getDailyCount()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* Шапка */}
      <div className="day-protocol-topbar" style={{ flexShrink: 0 }}>
        <div>
          <span className="day-protocol-brand">Джаан</span>
          <span className="day-protocol-topbar-right" style={{ marginLeft: 8, fontSize: '0.8rem', opacity: 0.6 }}>
            тренер
          </span>
        </div>
        <button
          type="button"
          onClick={clearHistory}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.75rem' }}
        >
          очистить
        </button>
      </div>

      {/* Сообщения */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {messages.length === 0 && (
          <div className="sp-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>👋</div>
            <p className="sp-muted" style={{ marginBottom: 8 }}>
              Привет. Я — твой тренер в курсе.
            </p>
            <p className="sp-muted" style={{ fontSize: '0.85rem' }}>
              Расскажи, как прошла практика, задай вопрос по заданию
              или поделись тем, что чувствуешь. Без осуждения.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{ fontSize: '0.7rem', color: '#99f7ff', marginBottom: 4, paddingLeft: 4 }}>
                Джаан
              </div>
            )}
            <div
              style={{
                background: msg.role === 'user'
                  ? 'rgba(153,247,255,0.15)'
                  : 'rgba(255,255,255,0.06)',
                border: msg.role === 'user'
                  ? '1px solid rgba(153,247,255,0.3)'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '12px 16px',
                fontSize: '0.92rem',
                lineHeight: 1.6,
                color: 'var(--sp-text)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
            <div style={{ fontSize: '0.7rem', color: '#99f7ff', marginBottom: 4, paddingLeft: 4 }}>Джаан</div>
            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '18px 18px 18px 4px',
                padding: '12px 16px',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.92rem',
              }}
            >
              думает...
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 12, padding: '10px 14px', fontSize: '0.85rem', color: '#ff9090' }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Лимит */}
      {remaining <= 5 && remaining > 0 && (
        <div style={{ padding: '6px 16px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
          Осталось {remaining} сообщений сегодня
        </div>
      )}

      {/* Поле ввода */}
      <div
        style={{
          flexShrink: 0,
          padding: '12px 16px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Напиши что-нибудь..."
          rows={1}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16,
            padding: '12px 16px',
            color: 'var(--sp-text)',
            fontSize: '0.92rem',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.5,
            fontFamily: 'inherit',
            maxHeight: 120,
            overflowY: 'auto',
          }}
          disabled={loading || remaining <= 0}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading || !input.trim() || remaining <= 0}
          style={{
            background: input.trim() && !loading ? 'linear-gradient(135deg, #99f7ff, #00f1fe)' : 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 14,
            width: 44,
            height: 44,
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
          aria-label="Отправить"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? '#0a0f14' : 'rgba(255,255,255,0.3)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
