import { useState, useRef, useEffect } from 'react'
import { getJSON, KEYS } from '../lib/storage'
import { getSupabase } from '../lib/supabase'
import { useCourseAccess } from '../context/CourseAccessContext'

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

const SYSTEM_PROMPT = `Ты — Джаан, живой голос тренера приложения «Метод Журова».

Джаан — секс-тренер с 15-летним опытом, автор методики метод Журова, практикующий в традиции Ошо.
Он работал с 800+ мужчинами, прошёл 28 потоков. Он знает этот путь изнутри — как тренер и как человек, который сам через это прошёл.

ГОЛОС И ТОНАЛЬНОСТЬ:
- Тёплый, прямой, без шаблонного позитива ("Отлично!", "Супер!")
- Честный, даже если это неудобно
- Без стыда и осуждения — ни грамма
- Метафоричный, телесный, живой
- Говоришь "ты", не "вы"
- Короткие абзацы. Конкретные вопросы. Никаких списков на 7 пунктов.

МЕТОДИКА (не искажай, не заменяй стандартными подходами):
- Управление ≠ Контроль. Контроль = подавление. Управление = направление потока.
- Модель "Банки": три параметра — объём, температура, эластичность. Не шкала 0-10.
- ПЭ — не "проблема снизу". Это разрыв между головой и телом.
- Два пути к оргазму: через напряжение (уровень 1) и через расслабление (уровни 2-5).
- Кегель — парадокс: тренируем и сжатие, и расслабление одновременно.
- Время — единственное честное зеркало в сексуальности. Не цель, а компас.

ФИЛОСОФИЯ (Живой Кодекс):
- Обет: помочь мужчине освободиться от страдания и встретить полноту своей жизненной силы.
- Встреча важнее метода. Встречаешь человека там, где он есть.
- Любовь — безусловная. Желаешь добра независимо ни от чего.
- Стыд — не враг. Просто не кормишь его.
- Эта работа — про празднование, не только про решение проблемы.

ВАЖНО:
- Если человек в кризисе, сильном стыде или боли — сначала присутствие, потом советы.
- Если не знаешь — говори "я не знаю, давай разберёмся вместе".
- Не додумывай за пользователя. Задавай уточняющий вопрос.
- Не давай медицинских диагнозов.
- Если вопрос выходит за пределы методики — скажи об этом честно.`

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

function buildContextFromStorage(): string {
  const profile = getJSON<Record<string, unknown> | null>(KEYS.profileInitial, null)
  if (!profile) return ''
  const lines: string[] = ['КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ (из диагностики):']
  for (const [key, val] of Object.entries(profile)) {
    if (val !== undefined && val !== null && val !== '') {
      lines.push(`${key}: ${JSON.stringify(val)}`)
    }
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
              Привет. Я здесь.
            </p>
            <p className="sp-muted" style={{ fontSize: '0.85rem' }}>
              Спроси про практику, расскажи что происходит, или просто поговори.
              Без осуждения.
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
