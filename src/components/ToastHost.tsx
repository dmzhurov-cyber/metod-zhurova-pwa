import { useEffect, useState } from 'react'

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    const onToast = (e: Event) => {
      const d = (e as CustomEvent<string>).detail
      if (typeof d !== 'string' || !d) return
      setMsg(d)
    }
    window.addEventListener('pwa_v2_toast', onToast as EventListener)
    return () => window.removeEventListener('pwa_v2_toast', onToast as EventListener)
  }, [])

  useEffect(() => {
    if (!msg) return
    const t = window.setTimeout(() => setMsg(null), 3200)
    return () => window.clearTimeout(t)
  }, [msg])

  if (!msg) return null
  return (
    <div
      role="status"
      className="sp-toast"
      style={{
        position: 'fixed',
        bottom: 'calc(var(--sp-nav-h) + var(--sp-safe-bottom) + 16px)',
        left: 16,
        right: 16,
        maxWidth: 480,
        margin: '0 auto',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div
        className="sp-card"
        style={{
          padding: '12px 16px',
          fontSize: '0.95rem',
          textAlign: 'center',
          boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
          border: '1px solid rgba(153,247,255,0.2)',
        }}
      >
        {msg}
      </div>
    </div>
  )
}
