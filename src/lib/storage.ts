const PREFIX = 'pwa_v2_'

export const KEYS = {
  installDone: `${PREFIX}install_onboarding_done`,
  initialDiagnostics: `${PREFIX}initial_diagnostics_done`,
  profileInitial: `${PREFIX}profile_initial`,   // данные начальной диагностики
  theme: `${PREFIX}theme`,
  userState: `${PREFIX}user_state`,
  syncQueue: `${PREFIX}sync_queue`,
  lastSync: `${PREFIX}last_sync_at`,
  aiMessages: `${PREFIX}ai_messages`,            // история чата с тренером
  aiDailyCount: `${PREFIX}ai_daily_count`,       // лимит сообщений в день
  notificationsEnabled: `${PREFIX}notifications_enabled`,
  notificationTime: `${PREFIX}notification_time`,
} as const

export function getJSON<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key)
    if (!s) return fallback
    return JSON.parse(s) as T
  } catch {
    return fallback
  }
}

export function setJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getFlag(key: string): boolean {
  return localStorage.getItem(key) === '1'
}

export function setFlag(key: string, on: boolean) {
  localStorage.setItem(key, on ? '1' : '0')
}
