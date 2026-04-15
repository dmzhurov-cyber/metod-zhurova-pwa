import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase } from '../lib/supabase'

export function ProfileAuthSection() {
  const sb = getSupabase()
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    if (!sb) return
    void sb.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [sb])

  if (!sb) {
    return (
      <div className="sp-card" style={{ marginBottom: 16 }}>
        <h2 className="sp-display" style={{ fontSize: '1rem', marginBottom: 8 }}>
          Аккаунт
        </h2>
        <p className="sp-muted">Вход временно недоступен. Прогресс сохраняется локально на устройстве.</p>
      </div>
    )
  }

  async function sendLink() {
    if (!sb) return
    const trimmed = email.trim()
    if (!trimmed) {
      setHint('Введите email')
      return
    }
    setBusy(true)
    setHint(null)
    const base = import.meta.env.BASE_URL
    const root = base === '/' ? '' : base.replace(/\/$/, '')
    const redirectTo = `${window.location.origin}${root}/app/profile`
    const { error } = await sb.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: redirectTo },
    })
    setBusy(false)
    if (error) {
      setHint(error.message)
      return
    }
    setHint('Ссылка отправлена. Открой её в этом же браузере — и ты внутри.')
  }

  async function signOut() {
    if (!sb) return
    setBusy(true)
    await sb.auth.signOut()
    setBusy(false)
    setHint(null)
  }

  if (session?.user) {
    return (
      <div className="sp-card" style={{ marginBottom: 16 }}>
        <h2 className="sp-display" style={{ fontSize: '1rem', marginBottom: 8 }}>
          Аккаунт
        </h2>
        <p className="sp-muted" style={{ marginBottom: 8 }}>
          Вы вошли как <strong>{session.user.email ?? session.user.id}</strong>
        </p>
        <button type="button" className="sp-btn-ghost" disabled={busy} onClick={() => void signOut()}>
          Выйти
        </button>
      </div>
    )
  }

  return (
    <div className="sp-card" style={{ marginBottom: 16 }}>
      <h2 className="sp-display" style={{ fontSize: '1rem', marginBottom: 8 }}>
        Вход в аккаунт
      </h2>
      <p className="sp-muted" style={{ marginBottom: 12, fontSize: '0.9rem' }}>
        Введи email — пришлём ссылку для входа. Без пароля.
      </p>
      <input
        type="email"
        className="sp-card"
        style={{ width: '100%', padding: 10, borderRadius: 10, marginBottom: 8 }}
        placeholder="твой@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <button type="button" className="sp-btn-primary" disabled={busy} onClick={() => void sendLink()}>
        {busy ? 'Отправка…' : 'Получить ссылку'}
      </button>
      {hint && (
        <p className="sp-muted" style={{ marginTop: 10 }}>
          {hint}
        </p>
      )}
    </div>
  )
}
