/** Схемы курса (SVG в `public/course-assets/schemes/`). По возможности — день, соответствующий теме. */
export const extraSchemesForDay: Record<number, { name: string; file: string }[]> = {
  1: [{ name: 'Модель «Банки» возбуждения', file: 'scheme-03-arousal-bank.svg' }],
  2: [{ name: 'Дыхание и шкала возбуждения', file: 'scheme-09-breathing-arousal.svg' }],
  3: [{ name: '5 типов триггеров · ПОНР (карта)', file: 'scheme-05-triggers-ponr.svg' }],
  4: [{ name: 'Фазы эякуляции и ПОНР', file: 'scheme-04-ejaculation-phases.svg' }],
  5: [{ name: 'Четыре столпа контроля', file: 'scheme-07-four-pillars.svg' }],
  6: [{ name: 'Дыхание 4-7-8 и возбуждение', file: 'scheme-09-breathing-arousal.svg' }],
  7: [{ name: 'Интеграция методов (неделя 1)', file: 'scheme-10-integration.svg' }],
  8: [{ name: 'Модель возбуждения (ОМ)', file: 'scheme-06-pen-model.svg' }],
  9: [{ name: 'Тазовое дно и PC-зона', file: 'scheme-08-pc-muscle.svg' }],
  10: [{ name: 'PC-мышца · расслабление', file: 'scheme-08-pc-muscle.svg' }],
  11: [{ name: 'Контекст и триггеры', file: 'scheme-05-triggers-ponr.svg' }],
  12: [{ name: 'Решение · динамика (карта)', file: 'scheme-05-triggers-ponr.svg' }],
  13: [{ name: 'Динамика и интеграция', file: 'scheme-10-integration.svg' }],
  14: [{ name: 'Карта триггеров (неделя 2)', file: 'scheme-05-triggers-ponr.svg' }],
  15: [{ name: 'Стоп-Старт и цикл возбуждения', file: 'scheme-06-pen-model.svg' }],
  16: [{ name: 'Расслабление и дыхание', file: 'scheme-09-breathing-arousal.svg' }],
  17: [{ name: 'ЛК / тазовое дно', file: 'scheme-08-pc-muscle.svg' }],
  18: [{ name: 'Сжатие и контроль', file: 'scheme-08-pc-muscle.svg' }],
  19: [{ name: 'Интеграция дыхания и мышц', file: 'scheme-10-integration.svg' }],
  20: [{ name: 'Работа с триггерами', file: 'scheme-05-triggers-ponr.svg' }],
  21: [{ name: 'Итоги недели 3 · интеграция', file: 'scheme-10-integration.svg' }],
  22: [{ name: 'Перенос в партнёрский секс', file: 'scheme-06-pen-model.svg' }],
  23: [{ name: 'Столпы при стрессе', file: 'scheme-07-four-pillars.svg' }],
  24: [{ name: 'Коммуникация и контекст', file: 'scheme-05-triggers-ponr.svg' }],
  25: [{ name: 'Партнёрская практика', file: 'scheme-06-pen-model.svg' }],
  26: [{ name: 'Множественные циклы', file: 'scheme-04-ejaculation-phases.svg' }],
  27: [{ name: 'Эмоции и столпы', file: 'scheme-07-four-pillars.svg' }],
  28: [{ name: 'Финальная подготовка', file: 'scheme-10-integration.svg' }],
  29: [{ name: 'Полная интеграция', file: 'scheme-10-integration.svg' }],
  30: [{ name: 'Финал курса · обзор', file: 'scheme-07-four-pillars.svg' }],
}

export function schemeAssetUrl(file: string) {
  return `${import.meta.env.BASE_URL}course-assets/schemes/${encodeURIComponent(file)}`
}
