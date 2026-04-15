import { useRef, useState, useEffect } from 'react'

interface AudioPlayerProps {
  src: string | null | undefined
  /** Короткое описание — показывается рядом с кнопкой */
  label?: string
  /** Автозапуск при открытии экрана */
  autoPlay?: boolean
}

/**
 * Минималистичный аудио-плеер голоса Джаана.
 * Показывает одну кнопку ▶/⏸ и прогресс-бар.
 * Если src не задан — компонент не рендерится (ждёт загрузки аудио).
 */
export function AudioPlayer({ src, label, autoPlay = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(false)

  // Сброс при смене src
  useEffect(() => {
    setPlaying(false)
    setProgress(0)
    setDuration(0)
    setError(false)
  }, [src])

  useEffect(() => {
    if (autoPlay && src && audioRef.current) {
      audioRef.current.play().catch(() => {})
    }
  }, [autoPlay, src])

  if (!src) return null

  function toggle() {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
    } else {
      a.play().catch(() => setError(true))
    }
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: 'rgba(153,247,255,0.07)',
        border: '1px solid rgba(153,247,255,0.18)',
        borderRadius: 14,
        marginTop: 12,
      }}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0) }}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onError={() => setError(true)}
      />

      {/* Кнопка play/pause */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Пауза' : 'Слушать'}
        style={{
          background: 'linear-gradient(135deg, #99f7ff, #00c6f0)',
          border: 'none',
          borderRadius: 10,
          width: 38,
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          color: '#0a0f14',
          fontSize: '1rem',
        }}
      >
        {playing ? '⏸' : '▶'}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Подпись */}
        {label && (
          <div style={{ fontSize: '0.78rem', color: '#99f7ff', marginBottom: 4 }}>
            {label}
          </div>
        )}

        {error ? (
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,120,120,0.8)' }}>
            Аудио недоступно
          </div>
        ) : (
          <>
            {/* Прогресс */}
            <div
              style={{
                height: 3,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                const a = audioRef.current
                if (!a || !duration) return
                const rect = e.currentTarget.getBoundingClientRect()
                const ratio = (e.clientX - rect.left) / rect.width
                a.currentTime = ratio * duration
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #99f7ff, #00c6f0)',
                  borderRadius: 2,
                  transition: 'width 0.1s linear',
                }}
              />
            </div>

            {/* Время */}
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
              {duration > 0 ? `${fmt(progress)} / ${fmt(duration)}` : 'Джаан · голос'}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
