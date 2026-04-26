/**
 * Одноразовая выдача доступа «как premium (18 900)»: Auth + подписка 90 дней.
 *
 * Не клади пароли в репозиторий. Создай scripts/alpha-users.local.json (см. .example)
 * и запусти с service role (только у себя, не в браузере):
 *
 *   node --env-file=.env.local scripts/provision-alpha-access.mjs
 *
 * Переменные: SUPABASE_URL (или VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Нужны SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в окружении (см. .env.local).')
  process.exit(1)
}

if (!existsSync(listPath)) {
  console.error(`Нет файла ${listPath}. Скопируй alpha-users.example.json и заполни.`)
  process.exit(1)
}

const { users, plan, days } = JSON.parse(readFileSync(listPath, 'utf8'))
if (!Array.isArray(users) || users.length === 0) {
  console.error('В JSON нет массива users')
  process.exit(1)
}

const effectivePlan = plan || 'premium'
const effectiveDays = Number(days) || 90
const periodEnd = new Date(Date.now() + effectiveDays * 24 * 60 * 60 * 1000).toISOString()

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function normEmail(s) {
  return String(s).replace(/\s+/g, '').toLowerCase()
}

async function findUserIdByEmail(email) {
  let page = 1
  const per = 200
  for (let i = 0; i < 20; i++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: per })
    if (error) throw error
    const u = data.users.find((x) => normEmail(x.email || '') === email)
    if (u) return u.id
    if (!data.users.length || data.users.length < per) return null
    page += 1
  }
  return null
}

for (const row of users) {
  const emailRaw = row.email
  const password = row.password
  if (!emailRaw || !password) {
    console.warn('Пропуск: нет email или password', row)
    continue
  }
  const email = normEmail(emailRaw)
  const label = email

  try {
    const { data: created, error: cErr } = await sb.auth.admin.createUser({
      email,
      password: String(password),
      email_confirm: true,
    })

    let userId = created?.user?.id

    if (cErr) {
      const exists =
        cErr.message?.toLowerCase().includes('already') ||
        cErr.message?.toLowerCase().includes('registered') ||
        cErr.status === 422
      if (exists) {
        userId = await findUserIdByEmail(email)
        if (!userId) {
          console.error('❌', label, 'уже в системе, но не найден в списке пользователей:', cErr.message)
          continue
        }
        const { error: uErr } = await sb.auth.admin.updateUserById(userId, {
          password: String(password),
          email_confirm: true,
        })
        if (uErr) {
          console.error('❌', label, 'обновление пароля:', uErr.message)
          continue
        }
        console.log('↻', label, 'пароль обновлён, id=', userId)
      } else {
        console.error('❌', label, cErr.message)
        continue
      }
    } else {
      console.log('✓', label, 'создан, id=', userId)
    }

    const { error: subErr } = await sb.from('subscriptions').upsert(
      {
        user_id: userId,
        plan: effectivePlan,
        status: 'active',
        provider: 'alpha_manual',
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    if (subErr) {
      console.error('❌', label, 'subscriptions:', subErr.message)
      continue
    }

    const { error: upErr } = await sb.from('user_profiles').upsert(
      {
        id: userId,
        email,
        subscription_status: 'active',
        subscription_type: 'premium',
        subscription_expires_at: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    if (upErr) {
      console.warn('⚠', label, 'user_profiles:', upErr.message)
    }

    console.log('  → план', effectivePlan, 'до', periodEnd)
  } catch (e) {
    console.error('❌', label, e)
  }
}

console.log('Готово.')
