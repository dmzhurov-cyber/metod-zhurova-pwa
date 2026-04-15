import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://ekdokmixrohhilgypjkm.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var')
  process.exit(1)
}

const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')

const extraSQL = `
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS password_hash text;

CREATE TABLE IF NOT EXISTS public.access_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token text UNIQUE NOT NULL,
  plan text NOT NULL,
  duration_days integer NOT NULL,
  expires_at timestamptz,
  max_uses integer DEFAULT 1,
  used_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;
`

const allSQL = schemaSQL + '\n' + extraSQL

// Split into individual statements and execute via rpc if possible,
// otherwise try the pg-meta query endpoint
async function tryPgMeta(sql) {
  const res = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })
  return { status: res.status, body: await res.text() }
}

// Try the database REST SQL endpoint
async function tryRestQuery(sql) {
  // Supabase v2 has /rest/v1/rpc endpoint for custom functions
  // But we need raw SQL — try creating a temp function
  const wrapperSQL = `
    DO $$ BEGIN
      ${sql.replace(/\$/g, '$$$$')}
    END $$;
  `
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ name: 'exec', args: { sql: wrapperSQL } }),
  })
  return { status: res.status, body: await res.text() }
}

console.log('Trying pg/query endpoint...')
let r = await tryPgMeta(allSQL)
console.log(`pg/query: ${r.status}`)
if (r.status === 200 || r.status === 201) {
  console.log('SUCCESS via pg/query!')
  console.log(r.body.substring(0, 500))
  process.exit(0)
}

console.log('pg/query not available, listing existing tables...')

// At minimum, verify connectivity and list existing tables
const listRes = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SERVICE_ROLE_KEY}`, {
  headers: { 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
})
if (listRes.ok) {
  const defs = await listRes.json()
  const tables = defs.definitions ? Object.keys(defs.definitions) : []
  console.log('Existing tables:', tables.join(', '))
} else {
  // Try OpenAPI schema
  const schemaRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  })
  console.log('REST schema status:', schemaRes.status)
}

console.log('')
console.log('=== Cannot execute DDL via REST API ===')
console.log('Please run SQL manually in Supabase SQL Editor:')
console.log('https://supabase.com/dashboard/project/ekdokmixrohhilgypjkm/sql/new')
