/**
 * ILL-DAY-01…30.svg — единый визуальный язык Control Protocol (тёмный фон, cyan, без длинного текста).
 * Герой экрана дня: узнаваемые мотивы по темам + абстрактный паттерн для остальных дней.
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/course-assets/illustrations')

const BG = '#0a0f14'
const CYAN = '#99f7ff'
const CYAN2 = '#00f1fe'
const MUTED = 'rgba(234,238,246,0.22)'
const GRN = '#5dcf8c'
const RED = '#ff6b6b'
const ORG = '#ffb74d'
const BLU = '#5b9fd4'
const PUR = '#b388ff'
const FG = '#eaeef6'

const radialGlowDef = `<radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${CYAN2}" stop-opacity="0.28"/><stop offset="70%" stop-color="${CYAN}" stop-opacity="0.05"/><stop offset="100%" stop-opacity="0"/></radialGradient>`

const defs = `
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#060a0e"/>
      <stop offset="55%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#111820"/>
    </linearGradient>
    <linearGradient id="barGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="${CYAN2}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${CYAN}" stop-opacity="0.15"/>
    </linearGradient>
    ${radialGlowDef}
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`

function abstractRings(day, cx, cy) {
  const seed = day * 17
  const nodes = 5 + (day % 6)
  const ringR = 36 + (day % 5) * 3
  const circles = []
  for (let i = 0; i < nodes; i++) {
    const a = (i / nodes) * Math.PI * 2 + seed * 0.01
    const ox = cx + Math.cos(a) * ringR
    const oy = cy + Math.sin(a) * ringR
    const pr = 4 + (i % 3)
    circles.push(
      `<circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="${pr}" fill="none" stroke="${CYAN}" stroke-width="1.2" opacity="${0.4 + (i % 4) * 0.1}"/>`,
    )
  }
  return `
  <circle cx="${cx}" cy="${cy}" r="88" fill="url(#glow)" opacity="0.85"/>
  <circle cx="${cx}" cy="${cy}" r="${58 + (day % 4) * 2}" fill="none" stroke="${MUTED}" stroke-width="1" stroke-dasharray="4 7" opacity="0.65"/>
  <circle cx="${cx}" cy="${cy}" r="${26 + (day % 3) * 2}" fill="none" stroke="${CYAN}" stroke-width="1.1" opacity="0.3" filter="url(#soft)"/>
  ${circles.join('\n  ')}
  <path d="M ${cx - ringR - 6} ${cy} Q ${cx} ${cy - ringR * 0.55} ${cx + ringR + 6} ${cy}" fill="none" stroke="${CYAN2}" stroke-width="0.9" opacity="0.22"/>`
}

function miniBars(seed, x0, yBase, n, w, gap) {
  const parts = []
  for (let b = 0; b < n; b++) {
    const h = 22 + ((seed + b * 13) % 40)
    const x = x0 + b * gap
    parts.push(
      `<rect x="${x}" y="${yBase - h}" width="${w}" height="${h}" rx="3" fill="url(#barGrad)" opacity="${0.22 + (b % 3) * 0.12}"/>`,
    )
  }
  return parts.join('\n  ')
}

/** День 1 — «три банки». */
function ill1() {
  return `
  ${abstractRings(1, 300, 118)}
  ${[0, 1, 2]
    .map((i) => {
      const x = 48 + i * 52
      const h = 72 + i * 16
      return `<rect x="${x}" y="${218 - h}" width="36" height="${h}" rx="10" fill="rgba(153,247,255,0.08)" stroke="${CYAN}" stroke-width="1.2"/>
  <rect x="${x + 6}" y="${218 - h + 8}" width="24" height="${Math.max(12, h - 28)}" rx="6" fill="url(#barGrad)" opacity="0.5"/>`
    })
    .join('\n  ')}`
}

/** День 2 — вертикальная шкала (компактно). */
function ill2() {
  const bh = 200
  const bx = 56
  const by = 38
  const segs = [
    [0.2, GRN],
    [0.3, BLU],
    [0.2, ORG],
    [0.25, RED],
    [0.05, PUR],
  ]
  let yb = by + bh
  const rects = []
  for (const [f, c] of segs) {
    const h = Math.round(bh * f)
    const yt = yb - h
    rects.push(`<rect x="${bx + 4}" y="${yt}" width="28" height="${h}" fill="${c}" fill-opacity="0.82"/>`)
    yb = yt
  }
  return `
  <rect x="${bx}" y="${by}" width="36" height="${bh}" rx="8" fill="rgba(6,10,14,0.85)" stroke="${CYAN}" stroke-width="1"/>
  ${rects.join('\n  ')}
  <text x="118" y="78" fill="${MUTED}" font-family="system-ui,sans-serif" font-size="8" font-weight="600">ЗОНЫ</text>
  <text x="118" y="98" fill="${GRN}" font-family="system-ui,sans-serif" font-size="9" font-weight="600">0–20</text>
  <text x="118" y="118" fill="${BLU}" font-family="system-ui,sans-serif" font-size="9" font-weight="600">20–50</text>
  <text x="118" y="148" fill="${ORG}" font-family="system-ui,sans-serif" font-size="9" font-weight="600">50–70</text>
  <text x="118" y="178" fill="${RED}" font-family="system-ui,sans-serif" font-size="9" font-weight="600">70–95</text>
  <text x="118" y="208" fill="${PUR}" font-family="system-ui,sans-serif" font-size="9" font-weight="600">95+</text>
  ${miniBars(2, 220, 228, 6, 20, 28)}`
}

/** Дни 3,11,12,14,20,24 — триггерная «звезда». */
function illTriggers(day) {
  const cx = 200
  const cy = 125
  const r = 26
  const n = 5
  const labels = ['Т', 'Г', 'С', 'Р', 'Д']
  const parts = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    const ox = cx + Math.cos(a) * 92
    const oy = cy + Math.sin(a) * 88
    parts.push(`<line x1="${cx}" y1="${cy}" x2="${ox}" y2="${oy}" stroke="${CYAN}" stroke-width="0.8" opacity="0.25"/>
  <circle cx="${ox}" cy="${oy}" r="18" fill="rgba(153,247,255,0.08)" stroke="${CYAN}" stroke-width="1"/>
  <text x="${ox}" y="${oy + 4}" text-anchor="middle" fill="${FG}" font-family="system-ui,sans-serif" font-size="9" font-weight="700">${labels[i]}</text>`)
  }
  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,107,107,0.12)" stroke="${RED}" stroke-width="1.6"/>
  <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="${RED}" font-family="system-ui,sans-serif" font-size="9" font-weight="700">П</text>`,
  )
  return parts.join('\n  ') + '\n  ' + miniBars(day, 48, 238, 8, 18, 30)
}

/** День 4,26 — фазы полосой. */
function illPhases(day) {
  const labs = ['В', 'П', 'П', 'Э']
  const parts = []
  for (let i = 0; i < 4; i++) {
    const x = 52 + i * 86
    parts.push(`<rect x="${x}" y="96" width="76" height="52" rx="12" fill="rgba(153,247,255,0.07)" stroke="${CYAN}" stroke-width="1"/>
  <text x="${x + 38}" y="128" text-anchor="middle" fill="${FG}" font-family="system-ui,sans-serif" font-size="10" font-weight="700">${labs[i]}</text>`)
    if (i < 3) {
      parts.push(
        `<line x1="${x + 76}" y1="122" x2="${x + 86}" y2="122" stroke="${CYAN2}" stroke-width="1.5" marker-end="url(#arr)"/>`,
      )
    }
  }
  return `
  <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="${CYAN2}"/></marker></defs>
  ${parts.join('\n  ')}
  ${abstractRings(day, 200, 210)}`
}

/** Дни 5,23,27,30 — четыре опоры. */
function illPillars(day) {
  const items = [
    ['Д', 70, 110],
    ['Т', 170, 110],
    ['В', 270, 110],
    ['Р', 370, 110],
  ]
  const parts = items.map(
    ([t, x, y]) => `<rect x="${x - 32}" y="${y - 36}" width="64" height="72" rx="14" fill="rgba(153,247,255,0.08)" stroke="${CYAN}" stroke-width="1.2"/>
  <text x="${x}" y="${y + 6}" text-anchor="middle" fill="${FG}" font-family="system-ui,sans-serif" font-size="12" font-weight="700">${t}</text>`,
  )
  return parts.join('\n  ') + '\n  ' + miniBars(day, 52, 228, 7, 20, 30)
}

/** Дни 6,16 — дыхание (волна + 4-7-8). */
function illBreath(day) {
  const path = []
  for (let x = 40; x <= 360; x += 4) {
    const y = 118 + Math.sin(x * 0.045) * 28
    path.push(`${x === 40 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`)
  }
  return `
  <path d="${path.join(' ')}" fill="none" stroke="${CYAN2}" stroke-width="2" opacity="0.65" filter="url(#soft)"/>
  ${['4', '7', '8']
    .map((n, i) => {
      const x = 120 + i * 80
      return `<text x="${x}" y="188" text-anchor="middle" fill="${GRN}" font-family="system-ui,sans-serif" font-size="22" font-weight="700" opacity="0.85">${n}</text>`
    })
    .join('\n  ')}
  <text x="200" y="214" text-anchor="middle" fill="${MUTED}" font-family="system-ui,sans-serif" font-size="8" letter-spacing="0.12em">ВДОХ · ПАУЗА · ВЫДОХ</text>
  ${miniBars(day, 48, 248, 6, 18, 32)}`
}

/** Дни 7,13,19,21,28,29 — цикл интеграции. */
function illLoop(day) {
  const labs = ['О', 'П', 'Д', 'О']
  const cx = 200
  const cy = 120
  const r = 78
  const parts = []
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2
    const ox = cx + Math.cos(a) * r
    const oy = cy + Math.sin(a) * r
    parts.push(`<circle cx="${ox}" cy="${oy}" r="22" fill="rgba(0,241,254,0.12)" stroke="${CYAN2}" stroke-width="1.3"/>
  <text x="${ox}" y="${oy + 5}" text-anchor="middle" fill="${FG}" font-family="system-ui,sans-serif" font-size="10" font-weight="700">${labs[i]}</text>`)
  }
  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="16" fill="rgba(153,247,255,0.15)" stroke="${CYAN}" stroke-width="1"/>`,
  )
  return parts.join('\n  ') + '\n  ' + miniBars(day, 48, 238, 8, 18, 30)
}

/** Дни 8,15,22,25 — протокол ОМ (5 узлов). */
function illOM(day) {
  const cols = [GRN, '#4ecdc4', ORG, RED, GRN]
  const parts = []
  const y = 118
  for (let i = 0; i < 5; i++) {
    const x = 48 + i * 74
    parts.push(`<circle cx="${x}" cy="${y}" r="26" fill="${cols[i]}" fill-opacity="0.2" stroke="${cols[i]}" stroke-width="1.8"/>
  <text x="${x}" y="${y + 5}" text-anchor="middle" fill="${FG}" font-family="system-ui,sans-serif" font-size="11" font-weight="700">${i + 1}</text>`)
    if (i < 4) {
      parts.push(
        `<line x1="${x + 26}" y1="${y}" x2="${x + 48}" y2="${y}" stroke="${MUTED}" stroke-width="1" stroke-dasharray="4 4"/>`,
      )
    }
  }
  return parts.join('\n  ') + '\n  ' + miniBars(day, 52, 228, 6, 20, 30)
}

/** Дни 9,10,17,18 — тазовое дно схематично. */
function illPelvic(day) {
  return `
  <ellipse cx="200" cy="125" rx="118" ry="68" fill="none" stroke="${CYAN}" stroke-width="1.2" opacity="0.35"/>
  <ellipse cx="200" cy="125" rx="72" ry="46" fill="rgba(0,241,254,0.1)" stroke="${CYAN2}" stroke-width="1.6"/>
  <text x="200" y="130" text-anchor="middle" fill="${FG}" font-family="system-ui,sans-serif" font-size="11" font-weight="600">PC</text>
  ${miniBars(day, 48, 232, 8, 18, 30)}`
}

/** Дни 22–24, 26–27 — партнёрский / стресс (два круга + мост). */
function illPartner(day) {
  return `
  <circle cx="120" cy="118" r="48" fill="rgba(153,247,255,0.06)" stroke="${CYAN}" stroke-width="1.3"/>
  <circle cx="280" cy="118" r="48" fill="rgba(153,247,255,0.06)" stroke="${CYAN}" stroke-width="1.3"/>
  <path d="M168 118 L232 118" stroke="${CYAN2}" stroke-width="1.5" stroke-dasharray="3 5" opacity="0.6"/>
  <text x="200" y="200" text-anchor="middle" fill="${MUTED}" font-family="system-ui,sans-serif" font-size="8" letter-spacing="0.14em">КОНТЕКСТ · КОНТРОЛЬ</text>
  ${abstractRings(day, 200, 118)}
  ${miniBars(day, 48, 238, 7, 18, 30)}`
}

/** Абстрактный герой по умолчанию. */
function illAbstract(day) {
  const cx = 200
  const cy = 125
  return `
  ${abstractRings(day, cx, cy)}
  ${miniBars(day * 3, 44, 228, 9, 18, 30)}`
}

function innerForDay(day) {
  switch (day) {
    case 1:
      return ill1()
    case 2:
      return ill2()
    case 3:
    case 11:
    case 12:
    case 14:
    case 20:
    case 24:
      return illTriggers(day)
    case 4:
    case 26:
      return illPhases(day)
    case 5:
    case 23:
    case 27:
    case 30:
      return illPillars(day)
    case 6:
    case 16:
      return illBreath(day)
    case 7:
    case 13:
    case 19:
    case 21:
    case 28:
    case 29:
      return illLoop(day)
    case 22:
      return illPartner(day)
    case 8:
    case 15:
    case 25:
      return illOM(day)
    case 9:
    case 10:
    case 17:
    case 18:
      return illPelvic(day)
    default:
      return illAbstract(day)
  }
}

function svgForDay(day) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" role="img" aria-label="">
${defs}
  <rect width="400" height="260" fill="url(#bgGrad)"/>
${innerForDay(day)}
  <text x="380" y="248" text-anchor="end" fill="${MUTED}" font-family="system-ui,Segoe UI,sans-serif" font-size="9" font-weight="600" letter-spacing="0.12em">${String(day).padStart(2, '0')}</text>
</svg>`
}

async function main() {
  await fs.mkdir(outDir, { recursive: true })
  for (let d = 1; d <= 30; d++) {
    const name = `ILL-DAY-${String(d).padStart(2, '0')}.svg`
    await fs.writeFile(path.join(outDir, name), svgForDay(d), 'utf8')
  }
  console.log('Wrote ILL-DAY-01…30.svg to', outDir)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
