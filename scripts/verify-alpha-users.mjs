/**
 * Проверка: все e-mail из alpha-users.local.json есть в Auth,
 * у каждого есть subscriptions (active + plan premium) и срок не истёк.
 *
 *   node --env-file=.env.local scripts/verify-alpha-users.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const listPath = join(__dirname, 'alpha-users.local.json')

const url =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Нужны SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!existsSync(listPath)) {
  console.error('Нет', listPath)
  process.exit(1)
}

const { users: expected } = JSON.parse(readFileSync(listPath, 'utf8'))
function norm(s) {
  return String(s).replace(/\s+/g, '').toLowerCase()
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const byEmail = new Map()
let page = 1
const per = 200
for (;;) {
  const { data, error } = await sb.auth.admin.listUsers({ page, perPage: per })
  if (error) {
    console.error('listUsers:', error)
    process.exit(1)
  }
  for (const u of data.users) {
    if (u.email) byEmail.set(norm(u.email), u)
  }
  if (data.users.length < per) break
  page += 1
}

const needPlan = 'premium'
const now = new Date()
let ok = 0
const issues = []

for (const row of expected) {
  const em = norm(row.email)
  const pwd = String(row.password || '')
  const user = byEmail.get(em)
  if (!user) {
    issues.push({ email: em, problem: 'нет в auth.users' })
    continue
  }
  if (!user.email_confirmed_at) {
    issues.push({ email: em, problem: 'email не подтверждён (должно быть ок при createUser с email_confirm)' })
  }
  if (pwd.length < 6) {
    issues.push({ email: em, problem: `пароль в файле слишком короткий (${pwd.length} симв.) — смени в Supabase или в JSON` })
  }

  const { data: sub, error: e2 } = await sb
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()
  if (e2) {
    issues.push({ email: em, problem: 'subscriptions: ' + e2.message })
    continue
  }
  if (!sub) {
    issues.push({ email: em, problem: 'нет строки в public.subscriptions' })
    continue
  }
  const st = String(sub.status || '').toLowerCase()
  if (st !== 'active' && st !== 'trialing') {
    issues.push({ email: em, problem: 'subscriptions.status = ' + sub.status })
    continue
  }
  if (String(sub.plan || '').toLowerCase() !== needPlan) {
    issues.push({ email: em, problem: 'plan = ' + sub.plan + ' (ожидали ' + needPlan + ')' })
    continue
  }
  if (sub.current_period_end) {
    const end = new Date(sub.current_period_end)
    if (end < now) {
      issues.push({ email: em, problem: 'подписка истекла: ' + sub.current_period_end })
      continue
    }
  }
  ok++
}

console.log('Ожидалось записей (список):', expected.length)
console.log('В Auth найдено уникальных e-mail (всего в проекте, выборка):', byEmail.size)
console.log('Полных ОК (auth + active premium + срок):', ok)
if (issues.length) {
  console.log('\nЗамечания:')
  for (const i of issues) console.log(' -', i.email, '→', i.problem)
  process.exit(1)
}
console.log('\nВсе', expected.length, 'пользователей из списка — в порядке для входа в PWA (тариф premium, доступ по дням/ИИ по коду).')
process.exit(0)
