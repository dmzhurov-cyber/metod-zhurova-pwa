import { getJSON, KEYS, setJSON } from './storage'
import { getSupabase } from './supabase'

export type SyncPayload = {
  id: string
  type: 'diagnostic' | 'progress' | 'event'
  payload: Record<string, unknown>
  createdAt: string
}

function loadQueue(): SyncPayload[] {
  return getJSON<SyncPayload[]>(KEYS.syncQueue, [])
}

function saveQueue(q: SyncPayload[]) {
  setJSON(KEYS.syncQueue, q)
}

export function getSyncQueueLength(): number {
  return loadQueue().length
}

export function enqueueSync(item: Omit<SyncPayload, 'id' | 'createdAt'> & { id?: string }) {
  const q = loadQueue()
  const row: SyncPayload = {
    id: item.id ?? crypto.randomUUID(),
    type: item.type,
    payload: item.payload,
    createdAt: new Date().toISOString(),
  }
  q.push(row)
  saveQueue(q)
}

export async function flushSyncQueue(): Promise<{ ok: number; fail: number }> {
  const sb = getSupabase()
  if (!sb) return { ok: 0, fail: 0 }

  const q = loadQueue()
  if (q.length === 0) return { ok: 0, fail: 0 }

  const {
    data: { session },
  } = await sb.auth.getSession()
  if (!session?.user) {
    return { ok: 0, fail: 0 }
  }

  let ok = 0
  let fail = 0
  const remaining: SyncPayload[] = []
  const uid = session.user.id

  for (const row of q) {
    try {
      const { error } = await sb.from('sync_events').insert({
        user_id: uid,
        event_type: row.type,
        body: row.payload,
        client_id: row.id,
        created_at: row.createdAt,
      })
      if (error) throw error
      ok++
    } catch {
      fail++
      remaining.push(row)
    }
  }

  saveQueue(remaining)
  if (ok > 0) localStorage.setItem(KEYS.lastSync, new Date().toISOString())
  return { ok, fail }
}
