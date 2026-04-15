/**
 * Пересобирает схемы курса в единой тёмной палитре протокола (без бежевого фона),
 * с достаточными отступами между строками — без наложения текста.
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dir = path.join(__dirname, '../public/course-assets/schemes')

const BG = '#0c1218'
const FG = '#eaeef6'
const MUTED = '#9aa3b0'
const CY = '#99f7ff'
const CY2 = '#00f1fe'
const RED = '#ff6b6b'
const GRN = '#5dcf8c'
const ORG = '#ffb74d'

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function wrap(content, w, h, title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#060a0e"/><stop offset="100%" stop-color="${BG}"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="${w / 2}" y="36" text-anchor="middle" fill="${CY}" font-family="system-ui,Segoe UI,sans-serif" font-size="15" font-weight="700" letter-spacing="0.06em">${esc(
    title,
  )}</text>
${content}
</svg>`
}

function T(x, y, txt, opt = {}) {
  const fsz = opt.size ?? 11
  const fill = opt.fill ?? FG
  const fw = opt.bold ? 'font-weight="600"' : ''
  const an = opt.anchor ?? 'start'
  return `  <text x="${x}" y="${y}" fill="${fill}" font-family="system-ui,Segoe UI,sans-serif" font-size="${fsz}" text-anchor="${an}" ${fw}>${esc(txt)}</text>`
}

const schemes = {
  'scheme-01-physiology.svg': wrap(
    `
  <rect x="40" y="70" width="200" height="100" rx="14" fill="rgba(153,247,255,0.06)" stroke="${CY}" stroke-width="1.2"/>
  ${T(140, 115, 'Вход сигналов', { anchor: 'middle', size: 12, bold: true })}
  <path d="M250 120 L310 120" stroke="${CY2}" stroke-width="2" marker-end="url(#m)"/>
  <rect x="320" y="70" width="200" height="100" rx="14" fill="rgba(153,247,255,0.06)" stroke="${CY}" stroke-width="1.2"/>
  ${T(420, 115, 'Спинной мозг / рефлексы', { anchor: 'middle', size: 11, bold: true })}
  <defs><marker id="m" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="${CY2}"/></marker></defs>
  <rect x="180" y="210" width="240" height="90" rx="14" fill="rgba(0,241,254,0.06)" stroke="${CY2}" stroke-width="1"/>
  ${T(300, 245, 'Интеграция · обратная связь', { anchor: 'middle', size: 12, bold: true })}
  ${T(300, 268, 'Упрощённая схема — детали в теории дня', { anchor: 'middle', size: 10, fill: MUTED })}
`,
    600,
    340,
    'ФИЗИОЛОГИЯ КОНТРОЛЯ',
  ),

  'scheme-02-neurophysiology.svg': wrap(
    `
  <circle cx="160" cy="160" r="52" fill="none" stroke="${CY}" stroke-width="1.5" opacity="0.5"/>
  <circle cx="300" cy="160" r="52" fill="none" stroke="${CY2}" stroke-width="1.5" opacity="0.5"/>
  <circle cx="440" cy="160" r="52" fill="none" stroke="${CY}" stroke-width="1.5" opacity="0.5"/>
  ${T(160, 165, 'Симпатика', { anchor: 'middle', size: 11, bold: true })}
  ${T(300, 165, 'Парасимпатика', { anchor: 'middle', size: 10, bold: true })}
  ${T(440, 165, 'Интеграция', { anchor: 'middle', size: 11, bold: true })}
  ${T(300, 260, 'Дыхание смещает баланс в сторону парасимпатики', { anchor: 'middle', size: 11, fill: MUTED })}
`,
    600,
    300,
    'НЕЙРОФИЗИОЛОГИЯ',
  ),

  'scheme-03-arousal-bank.svg': wrap(
    `
  ${['Объём', 'Температура', 'Эластичность'].map((label, i) => {
    const x = 80 + i * 170
    return `<rect x="${x}" y="90" width="130" height="160" rx="16" fill="rgba(153,247,255,0.07)" stroke="${CY}" stroke-width="1.2"/>
  ${T(x + 65, 140, label, { anchor: 'middle', size: 12, bold: true })}
  ${T(x + 65, 175, '«Банка»', { anchor: 'middle', size: 10, fill: MUTED })}`
  }).join('\n')}
  ${T(300, 290, 'Три параметра возбуждения — калибровка вниманием', { anchor: 'middle', size: 11, fill: MUTED })}
`,
    600,
    320,
    'МОДЕЛЬ «БАНКИ»',
  ),

  'scheme-04-ejaculation-phases.svg': wrap(
    `
  ${['Возбуждение', 'Плато', 'ПОНР', 'Эякуляция'].map((label, i) => {
    const x = 60 + i * 130
    return `<rect x="${x}" y="100" width="110" height="64" rx="12" fill="rgba(153,247,255,0.08)" stroke="${CY}" stroke-width="1"/>
  ${T(x + 55, 138, label, { anchor: 'middle', size: 10, bold: true })}`
  }).join('\n')}
  ${T(60, 200, '← раньше остановка проще', { size: 10, fill: GRN })}
  ${T(420, 200, 'позже → сложнее', { size: 10, fill: RED, anchor: 'end' })}
  <line x1="60" y1="230" x2="540" y2="230" stroke="${MUTED}" stroke-width="1" stroke-dasharray="4 6"/>
  ${T(300, 255, 'Цель протокола — узнавать зону до ПОНР и действовать заранее', { anchor: 'middle', size: 11, fill: MUTED })}
`,
    600,
    280,
    'ФАЗЫ И ПОНР',
  ),

  'scheme-05-triggers-ponr.svg': wrap(
    `
  <circle cx="300" cy="200" r="36" fill="rgba(255,107,107,0.15)" stroke="${RED}" stroke-width="2"/>
  ${T(300, 205, 'ПОНР', { anchor: 'middle', size: 12, bold: true, fill: RED })}
  ${['Голова', 'Тело', 'Ситуация', 'Динамика', 'Решение'].map((label, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2
    const cx = 300 + Math.cos(a) * 140
    const cy = 200 + Math.sin(a) * 140
    return `<line x1="300" y1="200" x2="${cx}" y2="${cy}" stroke="${CY}" stroke-width="1" opacity="0.35"/>
  <circle cx="${cx}" cy="${cy}" r="22" fill="rgba(153,247,255,0.1)" stroke="${CY}" stroke-width="1"/>
  ${T(cx, cy + 4, label, { anchor: 'middle', size: 9, bold: true })}`
  }).join('\n')}
  ${T(300, 360, 'Триггеры подталкивают к росту возбуждения — карта для самонаблюдения', { anchor: 'middle', size: 10, fill: MUTED })}
`,
    600,
    390,
    'ТРИГГЕРЫ · ПОНР',
  ),

  'scheme-06-pen-model.svg': wrap(
    `
  ${(() => {
    const steps = [
      ['1', 'Старт', '0–30%', '#7dd87a'],
      ['2', 'Рост', '30–50%', '#4ecdc4'],
      ['3', 'Внимание', '50–70%', '#ffb74d'],
      ['4', 'СТОП', '70%', '#ff6b6b'],
      ['5', 'Спад', '→ 40%', '#5dcf8c'],
    ]
    const cx0 = 88
    const gap = 118
    const cy = 118
    const parts = []
    for (let i = 0; i < steps.length; i++) {
      const cx = cx0 + i * gap
      const [num, lab, sub, col] = steps[i]
      parts.push(`<circle cx="${cx}" cy="${cy}" r="34" fill="${col}" fill-opacity="0.22" stroke="${col}" stroke-width="2"/>
  <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="${FG}" font-family="system-ui,sans-serif" font-size="11" font-weight="700">${esc(num)}</text>
  <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="${FG}" font-family="system-ui,sans-serif" font-size="9" font-weight="600">${esc(lab)}</text>
  <text x="${cx}" y="${cy + 26}" text-anchor="middle" fill="${MUTED}" font-family="system-ui,sans-serif" font-size="8">${esc(sub)}</text>`)
      if (i < steps.length - 1) {
        const x1 = cx + 34
        const x2 = cx0 + (i + 1) * gap - 34
        parts.push(
          `<line x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}" stroke="${MUTED}" stroke-width="1.2" stroke-dasharray="5 5" opacity="0.65"/>`,
        )
      }
    }
    return parts.join('\n')
  })()}
  ${T(360, 168, 'Повтори 5–10 циклов за сессию', { anchor: 'middle', size: 10, fill: CY2 })}

  <rect x="48" y="198" width="300" height="168" rx="14" fill="rgba(255,107,107,0.07)" stroke="${RED}" stroke-width="1.2"/>
  ${T(198, 222, 'Автоматический', { anchor: 'middle', size: 11, bold: true, fill: RED })}
  ${T(60, 244, '• Быстро к финишу', { size: 9, fill: FG })}
  ${T(60, 260, '• Без внимания к телу', { size: 9, fill: FG })}
  ${T(60, 276, '• Цель = оргазм', { size: 9, fill: FG })}
  ${T(60, 296, '• Закрепляет проблему', { size: 9, fill: RED, bold: true })}
  ${T(60, 330, 'Избегать в тренировке', { size: 9, fill: MUTED })}

  <rect x="368" y="198" width="304" height="168" rx="14" fill="rgba(93,207,140,0.08)" stroke="${GRN}" stroke-width="1.2"/>
  ${T(520, 222, 'Осознанный (ОМ)', { anchor: 'middle', size: 11, bold: true, fill: GRN })}
  ${T(380, 244, '• Медленно, с паузами', { size: 9, fill: FG })}
  ${T(380, 260, '• Внимание на ощущения', { size: 9, fill: FG })}
  ${T(380, 276, '• Цель = контроль', { size: 9, fill: FG })}
  ${T(380, 296, '• Тренирует навык', { size: 9, fill: GRN, bold: true })}
  ${T(380, 330, 'Базовый протокол курса', { size: 9, fill: MUTED })}
`,
    720,
    390,
    'ОСОЗНАННАЯ МАСТУРБАЦИЯ (ОМ)',
  ),

  'scheme-11-arousal-scale.svg': wrap(
    `
  <text x="88" y="68" text-anchor="middle" fill="${MUTED}" font-family="system-ui,sans-serif" font-size="10" font-weight="600">0%</text>
  <text x="88" y="348" text-anchor="middle" fill="${MUTED}" font-family="system-ui,sans-serif" font-size="10" font-weight="600">100%</text>
  <rect x="72" y="80" width="36" height="252" rx="8" fill="rgba(10,15,20,0.9)" stroke="${CY}" stroke-width="1"/>
  ${(() => {
    const hTot = 252
    const bottomY = 80 + hTot
    const segs = [
      [0.2, '#5dcf8c'],
      [0.3, '#5b9fd4'],
      [0.2, '#ffb74d'],
      [0.25, '#ff6b6b'],
      [0.05, '#b388ff'],
    ]
    let yBottom = bottomY
    const parts = []
    for (const [frac, col] of segs) {
      const h = Math.round(hTot * frac)
      const yTop = yBottom - h
      parts.push(`<rect x="76" y="${yTop}" width="28" height="${h}" fill="${col}" fill-opacity="0.88"/>`)
      yBottom = yTop
    }
    return parts.join('\n')
  })()}

  ${T(130, 95, 'Зелёная зона 0–20%', { size: 11, bold: true, fill: GRN })}
  ${T(130, 112, 'Спокойствие, полный контроль', { size: 9, fill: MUTED })}
  ${T(130, 148, 'Синяя зона 20–50%', { size: 11, bold: true, fill: '#7ec8e8' })}
  ${T(130, 165, 'Комфортное возбуждение · практика', { size: 9, fill: MUTED })}
  ${T(130, 201, 'Жёлтая зона 50–70%', { size: 11, bold: true, fill: ORG })}
  ${T(130, 218, 'Нужен контроль и калибровка', { size: 9, fill: MUTED })}
  ${T(130, 254, 'Красная зона 70–95%', { size: 11, bold: true, fill: RED })}
  ${T(130, 271, 'Срочные меры: стоп, дыхание', { size: 9, fill: MUTED })}
  ${T(130, 307, 'ПОНР 95%+', { size: 11, bold: true, fill: '#d4b3ff' })}
  ${T(130, 324, 'Точка невозврата — остановись раньше', { size: 9, fill: MUTED })}

  <rect x="130" y="348" width="460" height="52" rx="12" fill="rgba(153,247,255,0.08)" stroke="${CY}" stroke-width="1"/>
  ${T(360, 372, 'Правило 70%: останавливайся до 70% · цель тренировки — точность ±10%', { anchor: 'middle', size: 9, fill: FG })}
`,
    620,
    420,
    'ШКАЛА ВОЗБУЖДЕНИЯ 0–100%',
  ),

  'scheme-07-four-pillars.svg': wrap(
    `
  ${[
    ['Дыхание', 90, 120],
    ['Тело', 250, 120],
    ['Внимание', 410, 120],
    ['Ритм', 570, 120],
  ]
    .map(
      ([label, x, y]) => `<rect x="${x - 55}" y="${y - 40}" width="110" height="88" rx="14" fill="rgba(153,247,255,0.07)" stroke="${CY}" stroke-width="1.2"/>
  ${T(x, y + 5, label, { anchor: 'middle', size: 12, bold: true })}`,
    )
    .join('\n')}
  ${T(330, 260, 'Четыре опоры ежедневного контроля', { anchor: 'middle', size: 11, fill: MUTED })}
`,
    660,
    290,
    'ЧЕТЫРЕ СТОЛПА',
  ),

  'scheme-08-pc-muscle.svg': wrap(
    `
  <ellipse cx="300" cy="180" rx="120" ry="72" fill="none" stroke="${CY}" stroke-width="1.5" opacity="0.4"/>
  <ellipse cx="300" cy="180" rx="72" ry="44" fill="rgba(0,241,254,0.12)" stroke="${CY2}" stroke-width="1.5"/>
  ${T(300, 186, 'PC / тазовое дно', { anchor: 'middle', size: 12, bold: true })}
  ${T(300, 280, 'Расслабление в паузе важнее силы сжатия', { anchor: 'middle', size: 11, fill: MUTED })}
  ${T(300, 302, 'Схематично — не анатомический атлас', { anchor: 'middle', size: 10, fill: MUTED })}
`,
    600,
    330,
    'ТАЗОВОЕ ДНО · PC',
  ),

  'scheme-09-breathing-arousal.svg': wrap(
    `
  <text x="360" y="68" text-anchor="middle" fill="${CY2}" font-family="system-ui,sans-serif" font-size="12" font-weight="600">Влияние дыхания на возбуждение</text>
  <ellipse cx="200" cy="128" rx="58" ry="42" fill="rgba(153,247,255,0.14)" stroke="${CY}" stroke-width="1.6"/>
  ${T(200, 124, 'Лёгкие', { anchor: 'middle', size: 11, bold: true })}
  <ellipse cx="360" cy="128" rx="46" ry="38" fill="rgba(255,107,107,0.12)" stroke="${RED}" stroke-width="1.4"/>
  ${T(360, 124, 'Сердце', { anchor: 'middle', size: 11, bold: true })}
  <ellipse cx="520" cy="128" rx="58" ry="42" fill="rgba(153,247,255,0.1)" stroke="${CY}" stroke-width="1.5"/>
  ${T(520, 124, 'НС', { anchor: 'middle', size: 11, bold: true })}
  <path d="M260 128 L318 128" stroke="${GRN}" stroke-width="2" marker-end="url(#m2)"/>
  <path d="M408 128 L460 128" stroke="${GRN}" stroke-width="2" marker-end="url(#m2)"/>
  <path d="M520 172 Q 360 208 200 172" stroke="${RED}" stroke-width="1.5" fill="none" stroke-dasharray="5 5" opacity="0.75"/>
  <defs><marker id="m2" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="${GRN}"/></marker></defs>

  <rect x="48" y="218" width="300" height="218" rx="14" fill="rgba(255,107,107,0.07)" stroke="${RED}" stroke-width="1"/>
  ${T(198, 240, 'Поверхностное дыхание', { anchor: 'middle', size: 12, bold: true, fill: RED })}
  ${T(60, 262, '• Быстрое, неглубокое', { size: 10, fill: FG })}
  ${T(60, 280, '• Симпатическая активация', { size: 10, fill: FG })}
  ${T(60, 298, '• Рост стресса', { size: 10, fill: FG })}
  ${T(60, 322, '→ усиливает возбуждение', { size: 10, fill: RED, bold: true })}
  ${T(60, 342, '→ риск ускорения эякуляции', { size: 10, fill: RED, bold: true })}
  ${T(60, 368, 'Часто при ПЭ — избегать в практике', { size: 10, fill: MUTED })}

  <rect x="368" y="218" width="304" height="218" rx="14" fill="rgba(93,207,140,0.08)" stroke="${GRN}" stroke-width="1"/>
  ${T(520, 240, 'Глубокое дыхание', { anchor: 'middle', size: 12, bold: true, fill: GRN })}
  ${T(380, 262, '• Медленное, диафрагмальное', { size: 10, fill: FG })}
  ${T(380, 280, '• Парасимпатика', { size: 10, fill: FG })}
  ${T(380, 298, '• Снижение стресса', { size: 10, fill: FG })}
  ${T(380, 322, '→ снижает возбуждение', { size: 10, fill: GRN, bold: true })}
  ${T(380, 342, '→ больше окна для контроля', { size: 10, fill: GRN, bold: true })}
  ${T(380, 368, '4-7-8 и спокойный выдох', { size: 10, fill: MUTED })}

  <rect x="48" y="448" width="624" height="52" rx="12" fill="rgba(153,247,255,0.08)" stroke="${CY}" stroke-width="1"/>
  ${T(360, 472, '4-7-8: вдох 4с — пауза 7с — выдох 8с → парасимпатика → ниже уровень возбуждения', { anchor: 'middle', size: 10, fill: FG })}
`,
    720,
    528,
    'ДЫХАНИЕ И ШКАЛА ВОЗБУЖДЕНИЯ',
  ),

  'scheme-10-integration.svg': wrap(
    (() => {
      const nodes = [
        ['Осознать', 100],
        ['Пауза', 230],
        ['Дыхание', 360],
        ['Оценить', 490],
      ]
      const parts = nodes.map(([label, x], i) => {
        const line =
          i < nodes.length - 1
            ? `<line x1="${x + 28}" y1="160" x2="${nodes[i + 1][1] - 28}" y2="160" stroke="${CY2}" stroke-width="1.5"/>`
            : ''
        return `<circle cx="${x}" cy="160" r="28" fill="rgba(153,247,255,0.12)" stroke="${CY}" stroke-width="1.3"/>
  ${T(x, 165, label, { anchor: 'middle', size: 10, bold: true })}
  ${line}`
      })
      return `
  ${parts.join('\n')}
  ${T(300, 250, 'Цикл: заметил рост — остановил стимуляцию — дыхание — снова калибровка', { anchor: 'middle', size: 11, fill: MUTED })}
`
    })(),
    600,
    290,
    'ИНТЕГРАЦИЯ МЕТОДОВ',
  ),
}

async function main() {
  await fs.mkdir(dir, { recursive: true })
  for (const [name, svg] of Object.entries(schemes)) {
    await fs.writeFile(path.join(dir, name), svg, 'utf8')
  }
  console.log('Wrote', Object.keys(schemes).length, 'schemes to', dir)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
