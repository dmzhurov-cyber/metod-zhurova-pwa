import { useTheme } from '../context/useTheme'
import { flushSyncQueue, getSyncQueueLength } from '../lib/syncQueue'
import { getSupabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { useGame } from '../hooks/useGame'
import { loadGame, saveGame, setUsername, xpBarSegment } from '../lib/gameState'
import { getJSON } from '../lib/storage'
import { ProfileAuthSection } from '../components/ProfileAuthSection'
import { useCourseAccess } from '../context/CourseAccessContext'

const LANDING_URL = (import.meta.env.VITE_LANDING_URL as string | undefined)?.replace(/\/$/, '') || ''

function PromoSection({ onActivated }: { onActivated: () => void }) {
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function activate() {
    if (!code.trim()) return
    setLoading(true); setMsg(null)
    try {
      const sb = getSupabase()
      if (!sb) { setMsg({ ok: false, text: 'Нет подключения' }); return }
      const { data: { session } } = await sb.auth.getSession()
      if (!session) { setMsg({ ok: false, text: 'Войдите в аккаунт' }); return }

      const res = await fetch(`${LANDING_URL}/api/activate-promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ token: code.trim() }),
      })
      const data = await res.json()
      setMsg({ ok: res.ok, text: data.message || data.error || (res.ok ? 'Промокод активирован!' : 'Неверный промокод') })
      if (res.ok) {
        setCode('')
        onActivated()
      }
    } catch {
      setMsg({ ok: false, text: 'Ошибка сети' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sp-card" style={{ marginBottom: 16 }}>
      <h2 className="sp-display" style={{ fontSize: '1rem', marginBottom: 8 }}>Промокод</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          className="sp-field"
          style={{ flex: 1, minWidth: 140 }}
          placeholder="Введите промокод"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && void activate()}
        />
        <button className="sp-btn-ghost" onClick={() => void activate()} disabled={loading || !code.trim()}>
          {loading ? '...' : 'Активировать'}
        </button>
      </div>
      {msg && <p style={{ marginTop: 8, fontSize: '0.85rem', color: msg.ok ? '#99f7ff' : '#ff9090' }}>{msg.text}</p>}
    </div>
  )
}

const REM_ENABLED = 'pwa_v2_reminder_enabled'
const REM_TIME = 'pwa_v2_reminder_time'


export function Profile() {
  const { theme, toggle } = useTheme()
  const { accessLabel, maxUnlockedDay, loading: accessLoading, refresh: refreshAccess } = useCourseAccess()
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [queueLen, setQueueLen] = useState(() => getSyncQueueLength())
  const [hasSession, setHasSession] = useState(false)
  const hasSb = !!getSupabase()

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    void sb.auth.getSession().then(({ data }) => setHasSession(!!data.session?.user))
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setHasSession(!!session?.user))
    return () => sub.subscription.unsubscribe()
  }, [])
  const game = useGame()
  const bar = xpBarSegment(game.xp)
  const initial = getJSON<{ pti?: { score: number; level: string } } | null>('pwa_v2_profile_initial', null)

  const [name, setName] = useState(() => loadGame().username)

  const [remOn, setRemOn] = useState(() => localStorage.getItem(REM_ENABLED) === 'true')
  const [remTime, setRemTime] = useState(() => localStorage.getItem(REM_TIME) || '20:00')

  function saveRem() {
    localStorage.setItem(REM_ENABLED, remOn ? 'true' : 'false')
    localStorage.setItem(REM_TIME, remTime)
  }

  async function sync() {
    const r = await flushSyncQueue()
    setSyncMsg(`Отправлено: ${r.ok}, не удалось: ${r.fail}`)
    setQueueLen(getSyncQueueLength())
  }

  function saveName() {
    saveGame(setUsername(loadGame(), name))
  }

  return (
    <div>
      <h1 className="sp-display" style={{ fontSize: '1.25rem', marginBottom: 16 }}>
        Профиль
      </h1>

      <ProfileAuthSection />

      {hasSb && (
        <div className="sp-card" style={{ marginBottom: 16 }}>
          <h2 className="sp-display" style={{ fontSize: '1rem', marginBottom: 8 }}>
            Доступ к дням курса
          </h2>
          <p className="sp-muted" style={{ fontSize: '0.9rem' }}>
            {accessLoading
              ? 'Загрузка…'
              : accessLabel
                ? `${accessLabel} · открыты дни 1–${maxUnlockedDay}`
                : `Сборка: дни 1–${maxUnlockedDay} (переменная окружения и подписка в Supabase).`}
          </p>
        </div>
      )}

      <div className="sp-card" style={{ marginBottom: 16 }}>
        <p className="sp-muted">Имя</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <input
            className="sp-card"
            style={{ flex: 1, minWidth: 160, padding: 10, borderRadius: 10 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Имя"
          />
          <button type="button" className="sp-btn-ghost" onClick={saveName}>
            Сохранить
          </button>
        </div>
      </div>

      <div className="sp-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{bar.level}</div>
            <div className="sp-muted" style={{ fontSize: '0.85rem' }}>
              {bar.name} · {game.totalXpEarned} XP всего
            </div>
          </div>
        </div>
        {bar.need > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="sp-muted" style={{ fontSize: '0.8rem', marginBottom: 6 }}>
              До следующего уровня: {bar.current.toFixed(0)} / {bar.need} XP
            </div>
            <div className="sp-progress-bar">
              <i style={{ width: `${bar.pct}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="sp-card" style={{ marginBottom: 16 }}>
        <p className="sp-muted">Тема оформления</p>
        <button type="button" className="sp-btn-primary" onClick={toggle} style={{ marginTop: 12 }}>
          {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        </button>
      </div>

      <div className="sp-card" style={{ marginBottom: 16 }}>
        <h2 className="sp-display" style={{ fontSize: '1rem', marginBottom: 8 }}>
          Напоминания о практике
        </h2>
        <p className="sp-muted" style={{ fontSize: '0.9rem', marginBottom: 12 }}>
          Локально в браузере. Для уведомлений нужно разрешение; в установленном PWA стабильнее.
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={remOn} onChange={(e) => setRemOn(e.target.checked)} /> Включить напоминание
        </label>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label htmlFor="rem-t">Время</label>
          <input
            id="rem-t"
            type="time"
            value={remTime}
            onChange={(e) => setRemTime(e.target.value)}
            style={{ padding: 8, borderRadius: 8 }}
          />
        </div>
        <button type="button" className="sp-btn-ghost" style={{ marginTop: 12 }} onClick={saveRem}>
          Сохранить напоминание
        </button>
      </div>

      {initial?.pti && (
        <div className="sp-card" style={{ marginBottom: 16 }}>
          <h2 className="sp-display" style={{ fontSize: '1rem', marginBottom: 8 }}>
            Тонус тазового дна (PTI)
          </h2>
          <p className="sp-muted">
            Баллы: {initial.pti.score}, уровень: {initial.pti.level}
          </p>
        </div>
      )}

      {hasSession && <PromoSection onActivated={refreshAccess} />}

      <div className="sp-card" style={{ marginBottom: 16 }}>
        <p className="sp-muted">Синхронизация с облаком</p>
        {hasSb ? (
          <>
            <p className="sp-muted" style={{ marginTop: 8, fontSize: '0.9rem' }}>
              В очереди событий: <strong>{queueLen}</strong>
              {!hasSession && queueLen > 0 && (
                <span> — войдите в аккаунт выше, чтобы отправить их.</span>
              )}
            </p>
            <button type="button" className="sp-btn-ghost" style={{ marginTop: 12 }} onClick={() => void sync()}>
              Отправить очередь событий
            </button>
            {syncMsg && <p className="sp-muted" style={{ marginTop: 8 }}>{syncMsg}</p>}
          </>
        ) : (
          <p className="sp-muted" style={{ marginTop: 8, fontSize: '0.9rem' }}>
            Не подключено.
          </p>
        )}
      </div>

      {hasSession && (
        <button
          type="button"
          className="sp-btn-ghost"
          style={{ width: '100%', marginBottom: 16, color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}
          onClick={async () => {
            const sb = getSupabase()
            if (sb) await sb.auth.signOut()
          }}
        >
          Выйти из аккаунта
        </button>
      )}

      <div style={{ padding: '16px 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
        © 2026 ИП Журов Дмитрий. Метод Журова — авторская разработка.<br/>
        Не является медицинской услугой.
      </div>
    </div>
  )
}
