import { useState, useEffect } from 'react'
import { getSupabase } from '../lib/supabase'

type Mode = 'login' | 'reset' | 'new-password'

export function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  // Обрабатываем ссылку из письма Supabase (#type=recovery&access_token=...)
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      setMode('new-password')
    }
  }, [])

  async function handleLogin() {
    if (!email || !password) { setError('Введите email и пароль'); return }
    setLoading(true); setError(null)
    const sb = getSupabase()
    if (!sb) { setError('Нет подключения к серверу'); setLoading(false); return }
    const { error: err } = await sb.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Неверный email или пароль'
        : err.message)
    } else {
      onAuth()
    }
    setLoading(false)
  }

  async function handleReset() {
    if (!email) { setError('Введите email'); return }
    setLoading(true); setError(null)
    const sb = getSupabase()
    if (!sb) { setError('Нет подключения'); setLoading(false); return }
    await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    setResetSent(true)
    setLoading(false)
  }

  async function handleNewPassword() {
    if (!newPassword || newPassword.length < 8) { setError('Минимум 8 символов'); return }
    if (newPassword !== newPassword2) { setError('Пароли не совпадают'); return }
    setLoading(true); setError(null)
    const sb = getSupabase()
    if (!sb) { setError('Нет подключения'); setLoading(false); return }
    const { error: err } = await sb.auth.updateUser({ password: newPassword })
    if (err) {
      setError(err.message)
    } else {
      window.location.hash = ''
      onAuth()
    }
    setLoading(false)
  }

  if (mode === 'new-password') return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', background: '#0a0f14' }}>
      <div className="sp-card" style={{ width: '100%', maxWidth: 400, padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#99f7ff', marginBottom: 8 }}>Метод Журова</div>
          <div className="sp-muted" style={{ fontSize: '0.85rem' }}>Придумайте новый пароль</div>
        </div>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="Новый пароль (мин. 8 символов)"
          className="sp-field"
          style={{ marginBottom: 12 }}
        />
        <input
          type="password"
          value={newPassword2}
          onChange={e => setNewPassword2(e.target.value)}
          placeholder="Повторите пароль"
          className="sp-field"
          style={{ marginBottom: 20 }}
          onKeyDown={e => e.key === 'Enter' && void handleNewPassword()}
        />
        {error && <div style={{ color: '#ff9090', fontSize: '0.85rem', marginBottom: 12 }}>{error}</div>}
        <button
          className="sp-btn-primary"
          style={{ width: '100%' }}
          onClick={() => void handleNewPassword()}
          disabled={loading}
        >
          {loading ? 'Сохраняем...' : 'Сохранить пароль'}
        </button>
      </div>
    </div>
  )

  if (resetSent) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', background: '#0a0f14' }}>
      <div className="sp-card" style={{ width: '100%', maxWidth: 400, padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ marginBottom: 12 }}>Письмо отправлено на <strong>{email}</strong></p>
        <p className="sp-muted" style={{ marginBottom: 20 }}>Проверьте почту и перейдите по ссылке.</p>
        <button className="sp-btn-ghost" onClick={() => { setResetSent(false); setMode('login') }}>
          Назад
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', background: '#0a0f14' }}>
      <div className="sp-card" style={{ width: '100%', maxWidth: 400, padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#99f7ff', marginBottom: 8 }}>
            Метод Журова
          </div>
          <div className="sp-muted" style={{ fontSize: '0.85rem' }}>
            {mode === 'login' ? 'Войдите в аккаунт' : 'Восстановление пароля'}
          </div>
        </div>

        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="sp-field"
          style={{ marginBottom: 12 }}
        />

        {mode === 'login' && (
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Пароль"
            className="sp-field"
            style={{ marginBottom: 20 }}
            onKeyDown={e => e.key === 'Enter' && void handleLogin()}
          />
        )}

        {error && (
          <div style={{ color: '#ff9090', fontSize: '0.85rem', marginBottom: 12 }}>
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <>
            <button
              className="sp-btn-primary"
              style={{ width: '100%', marginBottom: 12 }}
              onClick={() => void handleLogin()}
              disabled={loading}
            >
              {loading ? 'Входим...' : 'Войти'}
            </button>
            <button
              type="button"
              style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', cursor: 'pointer', padding: 8 }}
              onClick={() => setMode('reset')}
            >
              Забыл пароль
            </button>
          </>
        ) : (
          <>
            <button
              className="sp-btn-primary"
              style={{ width: '100%', marginBottom: 12 }}
              onClick={() => void handleReset()}
              disabled={loading}
            >
              {loading ? 'Отправляем...' : 'Отправить ссылку'}
            </button>
            <button
              type="button"
              style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', cursor: 'pointer', padding: 8 }}
              onClick={() => setMode('login')}
            >
              Назад
            </button>
          </>
        )}
      </div>
    </div>
  )
}
