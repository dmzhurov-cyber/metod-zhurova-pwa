import { useEffect, useState } from 'react'
import { APP_VERSION } from '../lib/appVersion'
import { compareSemver } from '../lib/semver'

type Mode = 'none' | 'force' | 'soft'

export function VersionGateBanner() {
  const [mode, setMode] = useState<Mode>('none')

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`
    fetch(url, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { appVersion?: string; minSupported?: string } | null) => {
        if (!data) return
        const min = data.minSupported ?? '0.0.0'
        const remote = data.appVersion ?? '0.0.0'
        if (compareSemver(APP_VERSION, min) < 0) setMode('force')
        else if (compareSemver(APP_VERSION, remote) < 0) setMode('soft')
      })
      .catch(() => {})
  }, [])

  function forceUpdate() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
        setTimeout(() => window.location.reload(), 300)
      }).catch(() => window.location.reload())
    } else {
      window.location.reload()
    }
  }

  if (mode === 'none') return null

  if (mode === 'force') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: '#0a0f14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🔄</div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12, color: '#fff' }}>
            Необходимо обновление
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: 24 }}>
            Вышла новая версия приложения. Обновите для продолжения.
          </p>
          <button
            type="button"
            onClick={forceUpdate}
            style={{
              background: 'linear-gradient(135deg, #99f7ff, #00f1fe)',
              border: 'none', borderRadius: 12,
              padding: '14px 32px', color: '#0a0f14',
              fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
            }}
          >
            Обновить
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      role="status"
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '10px 14px',
        background: 'rgba(153,247,255,0.12)',
        borderBottom: '1px solid rgba(153,247,255,0.2)',
        fontSize: '0.9rem', textAlign: 'center',
      }}
    >
      Вышло обновление.{' '}
      <button
        type="button"
        className="sp-btn-ghost"
        style={{ marginLeft: 4 }}
        onClick={() => window.location.reload()}
      >
        Обновить
      </button>
    </div>
  )
}
