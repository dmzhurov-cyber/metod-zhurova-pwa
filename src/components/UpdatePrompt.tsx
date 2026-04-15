import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Баннер принудительного обновления PWA.
 * Показывается когда доступна новая версия приложения.
 * Монтируется в App.tsx один раз.
 */
export function UpdatePrompt() {
  const [show, setShow] = useState(false)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
      // Проверять обновление каждые 60 минут
      if (registration) {
        setInterval(() => {
          void registration.update()
        }, 60 * 60 * 1000)
      }
    },
  })

  useEffect(() => {
    if (needRefresh) setShow(true)
  }, [needRefresh])

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: 16,
        right: 16,
        zIndex: 9999,
        background: 'rgba(10,15,20,0.97)',
        border: '1px solid rgba(153,247,255,0.4)',
        borderRadius: 18,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ color: '#99f7ff', fontSize: '0.85rem', fontWeight: 600, marginBottom: 2 }}>
          Новая версия
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
          Обновление доступно — перезагрузи приложение
        </div>
      </div>
      <button
        type="button"
        onClick={() => { void updateServiceWorker(true) }}
        style={{
          background: 'linear-gradient(135deg, #99f7ff, #00f1fe)',
          border: 'none',
          borderRadius: 12,
          padding: '10px 18px',
          color: '#0a0f14',
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Обновить
      </button>
      <button
        type="button"
        onClick={() => setShow(false)}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer',
          fontSize: '1.2rem',
          padding: 4,
          flexShrink: 0,
        }}
        aria-label="Закрыть"
      >
        ×
      </button>
    </div>
  )
}
