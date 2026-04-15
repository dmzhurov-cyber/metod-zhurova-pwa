import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')
const outRoot = path.join(root, 'for-netlify-drop')
const outApp = path.join(outRoot, 'pwa-appfinal')

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  for (const e of entries) {
    const s = path.join(src, e.name)
    const d = path.join(dest, e.name)
    if (e.isDirectory()) await copyDir(s, d)
    else await fs.copyFile(s, d)
  }
}

async function main() {
  await fs.access(dist)
  await fs.rm(outRoot, { recursive: true, force: true })
  await fs.mkdir(outApp, { recursive: true })
  await copyDir(dist, outApp)

  const netlifyToml = `[build]
  publish = "."
  command = ""

# SPA: все маршруты React → index.html
[[redirects]]
  from = "/pwa-appfinal/*"
  to = "/pwa-appfinal/index.html"
  status = 200

[[redirects]]
  from = "/"
  to = "/pwa-appfinal/"
  status = 302
`

  await fs.writeFile(path.join(outRoot, 'netlify.toml'), netlifyToml, 'utf8')

  const redirectHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Переход…</title>
  <script>location.replace("/pwa-appfinal/" + (location.hash || ""));</script>
  <meta http-equiv="refresh" content="0;url=/pwa-appfinal/">
</head>
<body><p><a href="/pwa-appfinal/">Открыть приложение</a></p></body>
</html>
`
  await fs.writeFile(path.join(outRoot, 'index.html'), redirectHtml, 'utf8')

  console.log('Packed to', outRoot)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
