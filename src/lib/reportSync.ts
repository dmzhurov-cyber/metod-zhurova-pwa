import type { CheckpointDiagnostic, DailyRecord, DailyReport } from './courseProgress'
import { getJSON, KEYS, setJSON } from './storage'
import { getSupabase } from './supabase'

export type ReportOutboxItem = {
  id: string
  type: 'initial' | 'daily' | 'checkpoint' | 'chat'
  payload: Record<string, unknown>
  attempts: number
  lastError?: string
  createdAt: string
  nextRetryAt?: string
}

function loadOutbox(): ReportOutboxItem[] {
  return getJSON<ReportOutboxItem[]>(KEYS.reportOutbox, [])
}

function saveOutbox(q: ReportOutboxItem[]) {
  setJSON(KEYS.reportOutbox, q)
}

function backoffMs(attempts: number): number {
  return Math.min(60_000, 1000 * 2 ** Math.min(attempts, 6))
}

function pushOutboxItem(
  partial: Pick<ReportOutboxItem, 'type' | 'payload'> &
    Partial<Pick<ReportOutboxItem, 'id' | 'attempts' | 'lastError' | 'createdAt' | 'nextRetryAt'>>,
) {
  const q = loadOutbox()
  q.push({
    id: partial.id ?? crypto.randomUUID(),
    type: partial.type,
    payload: partial.payload,
    attempts: partial.attempts ?? 0,
    lastError: partial.lastError,
    createdAt: partial.createdAt ?? new Date().toISOString(),
    nextRetryAt: partial.nextRetryAt,
  })
  saveOutbox(q)
}

export function enqueueReportSync(item: Pick<ReportOutboxItem, 'type' | 'payload'>) {
  pushOutboxItem({ ...item, attempts: 0 })
}

function online(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

/** Стартовая диагностика: сразу в Supabase или в outbox. */
export async function syncInitialDiagnosticsPayload(payload: unknown): Promise<void> {
  if (!online()) {
    enqueueReportSync({ type: 'initial', payload: { payload } })
    return
  }
  const sb = getSupabase()
  if (!sb) {
    enqueueReportSync({ type: 'initial', payload: { payload } })
    return
  }
  const {
    data: { session },
  } = await sb.auth.getSession()
  if (!session?.user) {
    enqueueReportSync({ type: 'initial', payload: { payload } })
    return
  }
  const completedAt = new Date().toISOString()
  const { error } = await sb.from('app_initial_diagnostics').upsert(
    {
      user_id: session.user.id,
      payload,
      completed_at: completedAt,
      schema_version: 1,
    },
    { onConflict: 'user_id' },
  )
  if (error) {
    enqueueReportSync({ type: 'initial', payload: { payload } })
  }
}

/** Ежедневный отчёт после локального сохранения. */
export async function syncDailyReportRow(day: number, record: DailyRecord | undefined): Promise<void> {
  const report = (record?.reportData ?? {}) as DailyReport
  const completed = record?.completed ?? true
  const clientUpdatedAt = record?.date ?? new Date().toISOString()
  if (!online()) {
    enqueueReportSync({ type: 'daily', payload: { day, report, completed, clientUpdatedAt } })
    return
  }
  const sb = getSupabase()
  if (!sb) {
    enqueueReportSync({ type: 'daily', payload: { day, report, completed, clientUpdatedAt } })
    return
  }
  const {
    data: { session },
  } = await sb.auth.getSession()
  if (!session?.user) {
    enqueueReportSync({ type: 'daily', payload: { day, report, completed, clientUpdatedAt } })
    return
  }
  const { error } = await sb.from('daily_reports').upsert(
    {
      user_id: session.user.id,
      day,
      report: report as Record<string, unknown>,
      completed,
      client_updated_at: clientUpdatedAt,
      server_updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,day' },
  )
  if (error) {
    enqueueReportSync({ type: 'daily', payload: { day, report, completed, clientUpdatedAt } })
  }
}

/** Контрольная диагностика. */
export async function syncCheckpointRow(row: CheckpointDiagnostic): Promise<void> {
  if (!online()) {
    enqueueReportSync({ type: 'checkpoint', payload: { row } })
    return
  }
  const sb = getSupabase()
  if (!sb) {
    enqueueReportSync({ type: 'checkpoint', payload: { row } })
    return
  }
  const {
    data: { session },
  } = await sb.auth.getSession()
  if (!session?.user) {
    enqueueReportSync({ type: 'checkpoint', payload: { row } })
    return
  }
  const { error } = await sb.from('checkpoint_diagnostics').upsert(
    {
      user_id: session.user.id,
      day: row.day,
      answers: row.answers as Record<string, unknown>,
      total_average: row.totalAverage,
      result_level: row.resultLevel,
      completed_at: row.timestamp,
    },
    { onConflict: 'user_id,day' },
  )
  if (error) {
    enqueueReportSync({ type: 'checkpoint', payload: { row } })
  }
}

export type ChatOutboxPayload = {
  role: 'user' | 'assistant'
  content: string
  course_day: number | null
  client_sent_at: string
  app_version: string | null
  session_id: string | null
}

export async function syncChatMessage(payload: ChatOutboxPayload): Promise<boolean> {
  if (!online()) {
    enqueueReportSync({ type: 'chat', payload: { ...payload } })
    return false
  }
  const sb = getSupabase()
  if (!sb) {
    enqueueReportSync({ type: 'chat', payload: { ...payload } })
    return false
  }
  const {
    data: { session },
  } = await sb.auth.getSession()
  if (!session?.user) {
    enqueueReportSync({ type: 'chat', payload: { ...payload } })
    return false
  }
  const row: Record<string, unknown> = {
    user_id: session.user.id,
    role: payload.role,
    content: payload.content,
    course_day: payload.course_day,
    client_sent_at: payload.client_sent_at,
    app_version: payload.app_version,
  }
  if (payload.session_id) {
    row.session_id = payload.session_id
  }
  const { error } = await sb.from('chat_messages').insert(row)
  if (error) {
    enqueueReportSync({ type: 'chat', payload: { ...payload } })
    return false
  }
  return true
}

async function processOutboxItem(sb: NonNullable<ReturnType<typeof getSupabase>>, uid: string, item: ReportOutboxItem): Promise<boolean> {
  if (item.type === 'initial') {
    const payload = item.payload.payload
    const { error } = await sb.from('app_initial_diagnostics').upsert(
      {
        user_id: uid,
        payload,
        completed_at: new Date().toISOString(),
        schema_version: 1,
      },
      { onConflict: 'user_id' },
    )
    return !error
  }
  if (item.type === 'daily') {
    const { day, report, completed, clientUpdatedAt } = item.payload as {
      day: number
      report: DailyReport
      completed: boolean
      clientUpdatedAt: string
    }
    const { error } = await sb.from('daily_reports').upsert(
      {
        user_id: uid,
        day,
        report: report as Record<string, unknown>,
        completed,
        client_updated_at: clientUpdatedAt,
        server_updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,day' },
    )
    return !error
  }
  if (item.type === 'checkpoint') {
    const { row } = item.payload as { row: CheckpointDiagnostic }
    const { error } = await sb.from('checkpoint_diagnostics').upsert(
      {
        user_id: uid,
        day: row.day,
        answers: row.answers as Record<string, unknown>,
        total_average: row.totalAverage,
        result_level: row.resultLevel,
        completed_at: row.timestamp,
      },
      { onConflict: 'user_id,day' },
    )
    return !error
  }
  if (item.type === 'chat') {
    const p = item.payload as unknown as ChatOutboxPayload
    const row: Record<string, unknown> = {
      user_id: uid,
      role: p.role,
      content: p.content,
      course_day: p.course_day,
      client_sent_at: p.client_sent_at,
      app_version: p.app_version,
    }
    if (p.session_id) row.session_id = p.session_id
    const { error } = await sb.from('chat_messages').insert(row)
    return !error
  }
  return true
}

/** Отправка outbox: сессия + сеть; backoff по попыткам. */
export async function flushReportOutbox(): Promise<{ ok: number; fail: number }> {
  if (!online()) return { ok: 0, fail: 0 }
  const sb = getSupabase()
  if (!sb) return { ok: 0, fail: 0 }

  const {
    data: { session },
  } = await sb.auth.getSession()
  if (!session?.user) return { ok: 0, fail: 0 }

  const uid = session.user.id
  const now = Date.now()
  const all = loadOutbox()
  const due = all.filter((item) => !item.nextRetryAt || new Date(item.nextRetryAt).getTime() <= now)
  const deferred = all.filter((item) => item.nextRetryAt && new Date(item.nextRetryAt).getTime() > now)

  if (due.length === 0) return { ok: 0, fail: 0 }

  let ok = 0
  const failed: ReportOutboxItem[] = []

  for (const item of due) {
    try {
      const success = await processOutboxItem(sb, uid, item)
      if (success) ok++
      else {
        const attempts = item.attempts + 1
        failed.push({
          ...item,
          attempts,
          lastError: 'upsert_failed',
          nextRetryAt: new Date(Date.now() + backoffMs(attempts)).toISOString(),
        })
      }
    } catch {
      const attempts = item.attempts + 1
      failed.push({
        ...item,
        attempts,
        lastError: 'exception',
        nextRetryAt: new Date(Date.now() + backoffMs(attempts)).toISOString(),
      })
    }
  }

  saveOutbox([...deferred, ...failed])
  return { ok, fail: failed.length }
}
