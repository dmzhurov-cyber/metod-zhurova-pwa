import type { PtiLevel } from '../lib/ptiFromProfile'

/**
 * Как в legacy: для дня 17 теория заменяется на протокол по PTI (не смешивается с dayContentMap[17]).
 * Кнопки библиотеки — через onclick → data-lib в TheoryHtml.
 */
export function buildPelvicDay17Theory(level: PtiLevel | null): string {
  const lv: PtiLevel = level ?? 'low'
  let block = ''
  if (lv === 'high') {
    block = `
      <h3>Ваш протокол: только расслабление</h3>
      <p>По результатам теста PTI вам противопоказаны любые сжатия тазового дна. Сосредоточьтесь на обратных Кегелях и диафрагмально-тазовой координации.</p>
      <ol>
        <li>Лягте на спину, ноги согнуты. Сделайте 5 циклов дыхания 5-5.</li>
        <li>На выдохе мягко «вытолкните» тазовое дно (обратный Кегель). Удерживайте расслабление 3–5 секунд.</li>
        <li>На вдохе — вернитесь в нейтраль. Повторите 20 раз.</li>
        <li>Затем 3 минуты поза ребёнка (на коленях, лоб на полу) для растяжки.</li>
      </ol>
      <p>Повторяйте этот комплекс 2–3 раза в день. Через 2–3 недели повторите тест PTI.</p>
    `
  } else if (lv === 'moderate') {
    block = `
      <h3>Ваш протокол: расслабление с осторожностью</h3>
      <p>У вас умеренный риск гипертонуса. Исключите быстрые сжатия на 2–3 недели. Делайте только обратные Кегеля и дыхательные упражнения.</p>
      <ol>
        <li>Диафрагмально-тазовая координация: 20 циклов (вдох — лёгкое напряжение, выдох — расслабление).</li>
        <li>Обратные Кегеля: 3 подхода по 15 повторений (на выдохе — расслабление, удержание 3 сек).</li>
        <li>Растяжка: поза ребёнка, поза счастливого ребёнка (по 2 минуты).</li>
      </ol>
      <p>Через 2 недели повторите тест PTI. Если баллы снизились, можно постепенно вводить короткие сжатия.</p>
    `
  } else {
    block = `
      <h3>Комплекс 70/30: баланс расслабления и сокращения</h3>
      <p>Ваш тонус в норме (или данные ещё не введены — пройдите PTI в профиле). Выполняйте сбалансированную тренировку.</p>
      <ol>
        <li>Быстрые сжатия: 10 раз (1 сек сжатие, 1 сек расслабление).</li>
        <li>Удержания: 5 раз (5–7 сек сжатие, 5–7 сек расслабление).</li>
        <li>Обратные Кегеля: 3 подхода по 15 повторений.</li>
        <li>Заминка: диафрагмальное дыхание 5-5 (2 минуты).</li>
      </ol>
      <p>Помните: 70% времени — расслабление, 30% — сокращение.</p>
    `
  }
  return `
    <p style="font-size:0.95em;color:var(--sp-on-muted);margin-bottom:12px;">Протокол подобран по тесту PTI (профиль тонуса тазового дна).</p>
    <div class="theory-box" style="margin-top:4px;">${block}</div>
    <p style="margin-top:16px;"><button type="button" class="complete-btn" style="font-size:14px;" onclick="openLibraryAndShowTheory('pelvic-hypertonus-what')"><i class="fas fa-book-open"></i> Библиотека: гипертонус</button></p>
  `
}

/** Подсказка по тазовому дну для дней 9, 10, 16, 17 — как в legacy personalized pelvic-hint */
export function pelvicHintForDay(day: number, level: PtiLevel | null): string | null {
  if (!level || ![9, 10, 16, 17].includes(day)) return null
  const pelvicMsgs: Record<PtiLevel, string> = {
    high: 'По PTI — высокий риск гипертонуса. Избегай быстрых сжатий; фокус на обратных Кегелях и дыхании.',
    moderate: 'По PTI — умеренный риск. Исключи сжатия на 2–3 недели; расслабление таза в приоритете.',
    low: 'По PTI — тонус в норме. Комплекс 70/30 возможен; после сжатий отпускай таз.',
  }
  const text = pelvicMsgs[level]
  if (!text) return null
  return `
    <div class="personalized-hint pelvic-hint" style="margin-bottom:16px;padding:12px;border-radius:12px;background:rgba(153,247,255,0.08);border-left:3px solid var(--sp-primary-from);">
      <i class="fas fa-notes-medical"></i> <strong>Тазовое дно:</strong> ${text}
    </div>
  `
}
