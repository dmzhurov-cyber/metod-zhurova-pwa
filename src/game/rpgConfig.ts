/** Перенос RPG_CONFIG из pwa-appfinal/index.html */

export type RpgLevelConfig = { name: string; xp_threshold: number }

export const RPG_LEVELS: Record<number, RpgLevelConfig> = {
  1: { name: 'Начинающий', xp_threshold: 0 },
  2: { name: 'Чувствительный', xp_threshold: 20 },
  3: { name: 'Опытный', xp_threshold: 50 },
  4: { name: 'Мастер', xp_threshold: 90 },
  5: { name: 'Великий мастер', xp_threshold: 150 },
}

/** Порог «уровня» для достижения «Эксперт» (в legacy было level >= 10 при другой формуле) */
export const EXPERT_XP_MILESTONE = 1200

export const XP_PER_DAY_BASE = 3

export type SkillId = string

export type SkillNodeConfig = {
  tree: 'body' | 'muscle' | 'breath' | 'focus' | 'relax' | 'sound'
  reqLevel: number
  title: string
  desc: string
  prereqs: SkillId[]
  pos: { x: number; y: number }
  icon: string
}

export const RPG_SKILLS: Record<string, SkillNodeConfig> = {
  'body-1': {
    tree: 'body',
    reqLevel: 1,
    title: 'Базовое Распознавание',
    desc: 'Ощущение начального возбуждения, первых сигналов тела.',
    prereqs: [],
    pos: { x: 50, y: 85 },
    icon: 'fa-seedling',
  },
  'body-2': {
    tree: 'body',
    reqLevel: 2,
    title: 'Точное Определение',
    desc: 'Распознавание уровня возбуждения 40-60% и первых признаков ПОНР (точка невозврата).',
    prereqs: ['body-1', 'breath-1'],
    pos: { x: 35, y: 60 },
    icon: 'fa-crosshairs',
  },
  'body-3': {
    tree: 'body',
    reqLevel: 3,
    title: 'Предвидение ПОНР (точка невозврата)',
    desc: 'Ощущение тонких мышечных напряжений; предвидение ПОНР за 15-30 секунд.',
    prereqs: ['body-2'],
    pos: { x: 65, y: 40 },
    icon: 'fa-eye',
  },
  'body-4': {
    tree: 'body',
    reqLevel: 4,
    title: 'Мгновенный Контроль',
    desc: 'Мгновенное определение изменений в теле и точный контроль уровня возбуждения.',
    prereqs: ['body-3', 'focus-3'],
    pos: { x: 40, y: 20 },
    icon: 'fa-brain',
  },
  'muscle-1': {
    tree: 'muscle',
    reqLevel: 1,
    title: 'Основы Кегеля',
    desc: 'Базовые упражнения Кегеля и слабое напряжение PC-мышцы.',
    prereqs: [],
    pos: { x: 50, y: 85 },
    icon: 'fa-feather-alt',
  },
  'muscle-2': {
    tree: 'muscle',
    reqLevel: 2,
    title: 'Уверенные Сокращения',
    desc: 'Сильные, уверенные сокращения PC-мышцы; удержание 10-15 секунд.',
    prereqs: ['muscle-1'],
    pos: { x: 65, y: 65 },
    icon: 'fa-fist-raised',
  },
  'muscle-3': {
    tree: 'muscle',
    reqLevel: 3,
    title: 'Изолированное Напряжение',
    desc: 'Изолированное напряжение/расслабление; удержание 30+ секунд.',
    prereqs: ['muscle-2', 'body-2'],
    pos: { x: 35, y: 50 },
    icon: 'fa-bullseye',
  },
  'muscle-4': {
    tree: 'muscle',
    reqLevel: 5,
    title: 'Железная Выдержка',
    desc: 'Полный мышечный контроль и прецизионное управление эякуляцией.',
    prereqs: ['muscle-3', 'breath-3', 'body-4'],
    pos: { x: 55, y: 20 },
    icon: 'fa-shield-alt',
  },
  'breath-1': {
    tree: 'breath',
    reqLevel: 1,
    title: 'Дыхание 4-7-8',
    desc: 'Освоение техники дыхания для быстрого успокоения нервной системы.',
    prereqs: [],
    pos: { x: 50, y: 85 },
    icon: 'fa-wind',
  },
  'breath-2': {
    tree: 'breath',
    reqLevel: 2,
    title: 'Диафрагмальное Дыхание',
    desc: 'Глубокое дыхание животом для активации парасимпатической системы.',
    prereqs: ['breath-1'],
    pos: { x: 40, y: 60 },
    icon: 'fa-lungs',
  },
  'breath-3': {
    tree: 'breath',
    reqLevel: 4,
    title: 'Дыхание Волной',
    desc: 'Использование дыхания для перемещения ощущений по телу.',
    prereqs: ['breath-2', 'focus-2'],
    pos: { x: 65, y: 40 },
    icon: 'fa-water',
  },
  'breath-4': {
    tree: 'breath',
    reqLevel: 5,
    title: 'Огненное Дыхание',
    desc: 'Продвинутая техника для трансформации пикового возбуждения.',
    prereqs: ['breath-3', 'muscle-4'],
    pos: { x: 50, y: 15 },
    icon: 'fa-fire',
  },
  'focus-1': {
    tree: 'focus',
    reqLevel: 1,
    title: 'Осознанная Мастурбация',
    desc: 'Практика стимуляции с полным фокусом на ощущениях, без цели.',
    prereqs: ['body-1'],
    pos: { x: 50, y: 85 },
    icon: 'fa-hand-paper',
  },
  'focus-2': {
    tree: 'focus',
    reqLevel: 3,
    title: 'Управление Вниманием',
    desc: 'Переключение фокуса с гениталий на другие части тела.',
    prereqs: ['focus-1', 'body-2'],
    pos: { x: 60, y: 60 },
    icon: 'fa-compass',
  },
  'focus-3': {
    tree: 'focus',
    reqLevel: 4,
    title: 'Контроль Фантазий',
    desc: 'Сознательное управление ментальными образами для регуляции возбуждения.',
    prereqs: ['focus-2'],
    pos: { x: 30, y: 45 },
    icon: 'fa-theater-masks',
  },
  'focus-4': {
    tree: 'focus',
    reqLevel: 5,
    title: 'Состояние Потока',
    desc: 'Полное погружение в процесс без отвлечения и тревоги.',
    prereqs: ['focus-3', 'breath-3'],
    pos: { x: 55, y: 25 },
    icon: 'fa-atom',
  },
  'relax-1': {
    tree: 'relax',
    reqLevel: 1,
    title: 'Базовое Расслабление',
    desc: 'Снятие общего напряжения, умение отпускать зажимы в теле.',
    prereqs: [],
    pos: { x: 50, y: 85 },
    icon: 'fa-spa',
  },
  'relax-2': {
    tree: 'relax',
    reqLevel: 2,
    title: 'Расслабление Таза',
    desc: 'Осознанное расслабление тазовой области и PC-мышцы по желанию.',
    prereqs: ['relax-1', 'breath-1'],
    pos: { x: 40, y: 60 },
    icon: 'fa-circle-notch',
  },
  'relax-3': {
    tree: 'relax',
    reqLevel: 3,
    title: 'Сканирование Тела',
    desc: 'Поочередное расслабление зон: лицо, плечи, живот, таз во время практики.',
    prereqs: ['relax-2'],
    pos: { x: 65, y: 40 },
    icon: 'fa-body',
  },
  'relax-4': {
    tree: 'relax',
    reqLevel: 5,
    title: 'Глубокое Расслабление',
    desc: 'Полное снятие напряжения в критических моментах.',
    prereqs: ['relax-3', 'breath-2', 'body-3'],
    pos: { x: 50, y: 15 },
    icon: 'fa-leaf',
  },
  'sound-1': {
    tree: 'sound',
    reqLevel: 1,
    title: 'Осознание Звуков',
    desc: 'Замечать звуки (дыхание, окружение) как часть контекста, без реакции.',
    prereqs: ['body-1'],
    pos: { x: 50, y: 85 },
    icon: 'fa-volume-up',
  },
  'sound-2': {
    tree: 'sound',
    reqLevel: 2,
    title: 'Звук как Якорь',
    desc: 'Использование звука или ритма дыхания для удержания внимания и стабильности.',
    prereqs: ['sound-1', 'focus-1'],
    pos: { x: 35, y: 60 },
    icon: 'fa-anchor',
  },
  'sound-3': {
    tree: 'sound',
    reqLevel: 3,
    title: 'Нейтрализация Триггеров',
    desc: 'Когда звуки партнёра не сбивают контроль; звук — часть фона, не стимул.',
    prereqs: ['sound-2'],
    pos: { x: 65, y: 40 },
    icon: 'fa-assistive-listening-systems',
  },
  'sound-4': {
    tree: 'sound',
    reqLevel: 5,
    title: 'Интеграция Звука',
    desc: 'Звук в потоке без отвлечения; полное присутствие с партнёром.',
    prereqs: ['sound-3', 'focus-3'],
    pos: { x: 50, y: 15 },
    icon: 'fa-music',
  },
}

export const TREE_LABELS: Record<SkillNodeConfig['tree'], string> = {
  body: 'Тело и осознанность',
  muscle: 'Мышцы',
  breath: 'Дыхание',
  focus: 'Фокус',
  relax: 'Расслабление',
  sound: 'Звук',
}
