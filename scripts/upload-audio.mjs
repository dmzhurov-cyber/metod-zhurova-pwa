/**
 * Загрузчик аудио в Supabase Storage.
 *
 * Использование:
 *   node scripts/upload-audio.mjs <путь_к_файлу> <ключ>
 *
 * Примеры:
 *   node scripts/upload-audio.mjs audio/welcome.mp3 onboarding_welcome
 *   node scripts/upload-audio.mjs audio/day1.mp3 day_1
 *
 * Доступные ключи: onboarding_welcome, onboarding_path, onboarding_before_diagnostics,
 *   home_daily_greeting, checkpoint_week1, checkpoint_week2, checkpoint_week3,
 *   checkpoint_final, ai_trainer_welcome, day_1 ... day_30
 *
 * Ключ SUPABASE_SERVICE_ROLE_KEY берётся из .env.local (добавь его туда один раз).
 */

import { readFileSync, existsSync } from 'fs'
import { extname, basename } from 'path'
import { createHash } from 'crypto'

// ─── Конфиг ──────────────────────────────────────────────────────────────────

const PROJECT_URL = 'https://ekdokmixrohhilgypjkm.supabase.co'
const BUCKET = 'jaan-audio'
const ASSETS_FILE = new URL('../src/lib/audioAssets.ts', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

// ─── Читаем .env.local ───────────────────────────────────────────────────────

function readEnv() {
  const envPath = new URL('../.env.local', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
  if (!existsSync(envPath)) {
    console.error('❌ Нет файла .env.local')
    process.exit(1)
  }
  const lines = readFileSync(envPath, 'utf8').split('\n')
  const env = {}
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)=(.+)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

// ─── Создать bucket если нет ─────────────────────────────────────────────────

async function ensureBucket(serviceKey) {
  const res = await fetch(`${PROJECT_URL}/storage/v1/bucket`, {
    headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
  })
  const buckets = await res.json()
  if (!Array.isArray(buckets) || !buckets.find(b => b.id === BUCKET)) {
    console.log(`📦 Создаю bucket "${BUCKET}"...`)
    const r = await fetch(`${PROJECT_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
    })
    if (!r.ok) {
      const e = await r.text()
      if (!e.includes('already exists')) {
        console.error('❌ Не удалось создать bucket:', e)
        process.exit(1)
      }
    }
    console.log(`✅ Bucket "${BUCKET}" создан (public)`)
  }
}

// ─── Загрузить файл ───────────────────────────────────────────────────────────

async function uploadFile(filePath, trackKey, serviceKey) {
  const ext = extname(filePath).toLowerCase() || '.mp3'
  const mimeTypes = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.webm': 'audio/webm' }
  const contentType = mimeTypes[ext] || 'audio/mpeg'

  // Имя файла в storage: ключ + расширение
  const storageName = `${trackKey}${ext}`
  const fileData = readFileSync(filePath)

  console.log(`⬆️  Загружаю ${basename(filePath)} → ${BUCKET}/${storageName}`)

  const res = await fetch(`${PROJECT_URL}/storage/v1/object/${BUCKET}/${storageName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': contentType,
      'x-upsert': 'true',   // перезапишет если уже есть
    },
    body: fileData,
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('❌ Ошибка загрузки:', err)
    process.exit(1)
  }

  const publicUrl = `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/${storageName}`
  console.log(`✅ Загружено! URL:\n   ${publicUrl}`)
  return publicUrl
}

// ─── Обновить audioAssets.ts ──────────────────────────────────────────────────

function updateAssets(trackKey, url) {
  let src = readFileSync(ASSETS_FILE, 'utf8')

  // day_N → day_intro[N]
  const dayMatch = trackKey.match(/^day_(\d+)$/)
  if (dayMatch) {
    const n = dayMatch[1]
    // Ищем строку: "  N: null," или "  N: 'url',"
    const pattern = new RegExp(`(\\s+${n}:\\s*)null`, 'g')
    if (pattern.test(src)) {
      src = src.replace(new RegExp(`(\\s+${n}:\\s*)null`), `$1'${url}'`)
    } else {
      // Уже есть URL — заменяем
      src = src.replace(new RegExp(`(\\s+${n}:\\s*)'[^']*'`), `$1'${url}'`)
    }
  } else {
    // Ищем строку: "  trackKey: null," или "  trackKey: 'url',"
    const pattern = new RegExp(`(  ${trackKey}:\\s*)null`)
    if (pattern.test(src)) {
      src = src.replace(pattern, `$1'${url}'`)
    } else {
      src = src.replace(new RegExp(`(  ${trackKey}:\\s*)'[^']*'`), `$1'${url}'`)
    }
  }

  readFileSync(ASSETS_FILE, 'utf8') // проверка что файл доступен
  require('fs').writeFileSync(ASSETS_FILE, src, 'utf8')
  console.log(`📝 audioAssets.ts обновлён: ${trackKey} → URL`)
}

// ─── main ─────────────────────────────────────────────────────────────────────

import { writeFileSync } from 'fs'

const [,, filePath, trackKey] = process.argv

if (!filePath || !trackKey) {
  console.log(`
Использование:
  node scripts/upload-audio.mjs <файл> <ключ>

Примеры:
  node scripts/upload-audio.mjs audio/welcome.mp3 onboarding_welcome
  node scripts/upload-audio.mjs audio/day1.mp3 day_1

Ключи: onboarding_welcome, onboarding_path, onboarding_before_diagnostics,
  home_daily_greeting, day_1..day_30,
  checkpoint_week1, checkpoint_week2, checkpoint_week3, checkpoint_final,
  ai_trainer_welcome
`)
  process.exit(0)
}

if (!existsSync(filePath)) {
  console.error(`❌ Файл не найден: ${filePath}`)
  process.exit(1)
}

const env = readEnv()
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceKey) {
  console.error(`
❌ Нет SUPABASE_SERVICE_ROLE_KEY в .env.local

Добавь строку в c:\\Users\\user1\\Desktop\\Bookv2\\Джаан\\.env.local:
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (длинный ключ из Supabase → Settings → API)
`)
  process.exit(1)
}

await ensureBucket(serviceKey)
const url = await uploadFile(filePath, trackKey, serviceKey)

// Обновляем audioAssets.ts
const assetsSrc = readFileSync(ASSETS_FILE, 'utf8')
const dayMatch = trackKey.match(/^day_(\d+)$/)
let updated = assetsSrc

if (dayMatch) {
  const n = dayMatch[1]
  updated = updated.replace(new RegExp(`(\\s+${n}:\\s*)null`), `$1'${url}'`)
  updated = updated.replace(new RegExp(`(\\s+${n}:\\s*)'[^']*'`), `$1'${url}'`)
} else {
  updated = updated.replace(new RegExp(`(  ${trackKey}:\\s*)null`), `$1'${url}'`)
  updated = updated.replace(new RegExp(`(  ${trackKey}:\\s*)'[^']*'`), `$1'${url}'`)
}

if (updated !== assetsSrc) {
  writeFileSync(ASSETS_FILE, updated, 'utf8')
  console.log(`📝 audioAssets.ts обновлён`)
} else {
  console.log(`⚠️  Ключ "${trackKey}" не найден в audioAssets.ts — URL:\n   ${url}`)
}

console.log(`\n🎉 Готово! Теперь пересобери приложение или деплой на Netlify.`)
