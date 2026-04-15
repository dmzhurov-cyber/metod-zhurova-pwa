export type DailyTaskDef = {
  id: string
  icon: string
  bg: string
  title: string
  desc: string
  xp: number
  auto?: boolean
}

export const DAILY_TASKS: DailyTaskDef[] = [
  {
    id: 'login',
    icon: '🌅',
    bg: '#99f7ff',
    title: 'Открыть приложение',
    desc: 'Прийти — это уже шаг',
    xp: 10,
    auto: true,
  },
  {
    id: 'breathing',
    icon: '🌬️',
    bg: '#6d9086',
    title: 'Дыхательная практика',
    desc: '3 цикла 4-7-8. Тело начинает слышать',
    xp: 25,
  },
  {
    id: 'theory',
    icon: '📖',
    bg: '#9d4edd',
    title: 'Теория дня',
    desc: 'Прочитать и впустить — не запомнить',
    xp: 20,
  },
  {
    id: 'practice',
    icon: '🎯',
    bg: '#FF9800',
    title: 'Практика дня',
    desc: 'Сделать. Не идеально — живо',
    xp: 50,
  },
  {
    id: 'report',
    icon: '📝',
    bg: '#4CAF50',
    title: 'Отчёт',
    desc: 'Записать честно что было — это и есть зеркало',
    xp: 30,
  },
]
