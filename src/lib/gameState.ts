import { getJSON, setJSON } from './storage'
import { enqueueSync } from './syncQueue'
import { DAILY_TASKS } from '../game/dailyTasks'
import { EXPERT_XP_MILESTONE, RPG_LEVELS, RPG_SKILLS, XP_PER_DAY_BASE } from '../game/rpgConfig'
import { applyTaskTitleToSkills, defaultSkillBars, type SkillBars } from '../game/skillBars'
import type { CourseProgressState, DailyReport } from './courseProgress'
import { dailyReportWorthReportTask } from './dailyReportForm'
import { loadProgress, markDayComplete } from './courseProgress'

const GAME_KEY = 'pwa_v2_game'

export type GameState = {
  xp: number
  totalXpEarned: number
  /** Однократные награды за дни: `day-7`, checkpoint и т.д. */
  completedRewardIds: string[]
  unlockedSkills: string[]
  achievementIds: string[]
  streak: {
    current: number
    best: number
    lastCompletedDate: string | null
    lastLoginDate: string | null
  }
  dailies: {
    lastReset: string | null
    completed: string[]
  }
  skills: SkillBars
  /** Пройдены ли тесты из библиотеки */
  testResults: { pillars?: boolean; triggers?: boolean }
  username: string
}

export const defaultGameState = (): GameState => ({
  xp: 0,
  totalXpEarned: 0,
  completedRewardIds: [],
  unlockedSkills: [],
  achievementIds: [],
  streak: { current: 0, best: 0, lastCompletedDate: null, lastLoginDate: null },
  dailies: { lastReset: null, completed: [] },
  skills: defaultSkillBars(),
  testResults: {},
  username: 'Пользователь',
})

export function loadGame(): GameState {
  const d = defaultGameState()
  const raw = getJSON<Partial<GameState> | null>(GAME_KEY, null)
  if (!raw) return d
  return {
    ...d,
    ...raw,
    skills: { ...d.skills, ...raw.skills },
    streak: { ...d.streak, ...raw.streak },
    dailies: { ...d.dailies, ...raw.dailies },
    testResults: { ...d.testResults, ...raw.testResults },
  }
}

export function saveGame(s: GameState) {
  setJSON(GAME_KEY, s)
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('pwa_v2_game_update'))
}

function todayStr() {
  return new Date().toDateString()
}

/** Уровень 1–5 по суммарному XP (пороги из legacy RPG_CONFIG.levels) */
export function levelFromXp(xp: number): number {
  let level = 1
  for (let L = 5; L >= 1; L--) {
    if (xp >= RPG_LEVELS[L].xp_threshold) {
      level = L
      break
    }
  }
  return level
}

export function xpBarSegment(xp: number): { level: number; name: string; current: number; need: number; pct: number } {
  const level = levelFromXp(xp)
  const cur = RPG_LEVELS[level]
  const next = RPG_LEVELS[level + 1 as keyof typeof RPG_LEVELS]
  if (!next) {
    return { level, name: cur.name, current: xp - cur.xp_threshold, need: 0, pct: 100 }
  }
  const span = next.xp_threshold - cur.xp_threshold
  const pos = xp - cur.xp_threshold
  return {
    level,
    name: cur.name,
    current: pos,
    need: span,
    pct: span > 0 ? Math.min(100, Math.max(0, (pos / span) * 100)) : 100,
  }
}

function addXpRaw(state: GameState, amount: number): GameState {
  if (amount <= 0) return state
  const xp = state.xp + amount
  const totalXpEarned = state.totalXpEarned + amount
  let next = { ...state, xp, totalXpEarned }
  next = applyAutoUnlockSkills(next)
  return next
}

function applyAutoUnlockSkills(state: GameState): GameState {
  const level = levelFromXp(state.xp)
  const unlocked = new Set(state.unlockedSkills)
  let changed = false
  let guard = 0
  do {
    changed = false
    guard++
    for (const [id, sk] of Object.entries(RPG_SKILLS)) {
      if (unlocked.has(id)) continue
      if (level < sk.reqLevel) continue
      if (!sk.prereqs.every((p) => unlocked.has(p))) continue
      unlocked.add(id)
      changed = true
    }
  } while (changed && guard < 200)
  return { ...state, unlockedSkills: [...unlocked] }
}

export function checkDailyReset(state: GameState): GameState {
  const t = todayStr()
  if (state.dailies.lastReset === t) return state
  return {
    ...state,
    dailies: { lastReset: t, completed: [] },
  }
}

export function completeDailyTask(state: GameState, taskId: string): GameState {
  const s = checkDailyReset(state)
  if (s.dailies.completed.includes(taskId)) return s
  const task = DAILY_TASKS.find((x) => x.id === taskId)
  if (!task) return s
  const completed = [...s.dailies.completed, taskId]
  let next = addXpRaw(s, task.xp)
  if (completed.length === DAILY_TASKS.length) {
    next = addXpRaw(next, 100)
  }
  next = { ...next, dailies: { ...next.dailies, completed } }
  saveGame(next)
  enqueueSync({ type: 'event', payload: { kind: 'game_daily', taskId } })
  return next
}

export function onAppOpenForDailyLogin(state: GameState): GameState {
  let s = checkDailyReset(state)
  const t = todayStr()
  if (s.streak.lastLoginDate === t) {
    return completeDailyTask(s, 'login')
  }
  s = { ...s, streak: { ...s.streak, lastLoginDate: t } }
  s = completeDailyTask(s, 'login')
  return s
}

export function markTheoryRead(state: GameState): GameState {
  return completeDailyTask(state, 'theory')
}

export function markBreathingDone(state: GameState): GameState {
  return completeDailyTask(state, 'breathing')
}

function updateStreakOnDayComplete(state: GameState): GameState {
  const today = todayStr()
  const st = state.streak
  if (st.lastCompletedDate === today) return state
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  let current = 1
  let best = st.best || 0
  if (st.lastCompletedDate === yesterday.toDateString()) {
    current = (st.current || 0) + 1
    if (current > best) best = current
  } else {
    current = 1
    if (best < 1) best = 1
  }
  let next: GameState = {
    ...state,
    streak: { ...st, current, best, lastCompletedDate: today },
  }
  const bonus = Math.min(current * 5, 50)
  next = addXpRaw(next, bonus)
  enqueueSync({ type: 'event', payload: { kind: 'game_streak', current } })
  return next
}

const ACHIEVEMENTS: {
  id: string
  xp: number
  condition: (g: GameState, course: CourseProgressState) => boolean
}[] = [
  { id: 'first_day', xp: 50, condition: (_, c) => c.completedDays.length >= 1 },
  { id: 'week_1', xp: 100, condition: (_, c) => c.completedDays.length >= 7 },
  { id: 'week_2', xp: 150, condition: (_, c) => c.completedDays.length >= 14 },
  { id: 'halfway', xp: 200, condition: (_, c) => c.completedDays.length >= 15 },
  { id: 'week_3', xp: 250, condition: (_, c) => c.completedDays.length >= 21 },
  { id: 'master', xp: 500, condition: (_, c) => c.completedDays.length >= 30 },
  { id: 'streak_3', xp: 75, condition: (g) => (g.streak.best || 0) >= 3 },
  { id: 'streak_7', xp: 150, condition: (g) => (g.streak.best || 0) >= 7 },
  { id: 'streak_14', xp: 300, condition: (g) => (g.streak.best || 0) >= 14 },
  { id: 'level_5', xp: 100, condition: (g) => levelFromXp(g.xp) >= 5 },
  {
    id: 'level_10',
    xp: 200,
    condition: (g) => g.totalXpEarned >= EXPERT_XP_MILESTONE,
  },
  {
    id: 'tests',
    xp: 120,
    condition: (g) => !!(g.testResults.pillars && g.testResults.triggers),
  },
]

function grantAchievement(state: GameState, id: string, xp: number): GameState {
  if (state.achievementIds.includes(id)) return state
  const achievementIds = [...state.achievementIds, id]
  const next = addXpRaw({ ...state, achievementIds }, xp)
  saveGame(next)
  enqueueSync({ type: 'event', payload: { kind: 'game_achievement', id } })
  return next
}

export function checkAchievements(state: GameState, course: CourseProgressState): GameState {
  let next = state
  for (const a of ACHIEVEMENTS) {
    if (next.achievementIds.includes(a.id)) continue
    if (a.condition(next, course)) {
      next = grantAchievement(next, a.id, a.xp)
    }
  }
  return next
}

export function setTestResult(
  state: GameState,
  key: 'pillars' | 'triggers',
  done: boolean,
): GameState {
  const testResults = { ...state.testResults, [key]: done }
  let next = { ...state, testResults }
  const course = loadProgress()
  next = checkAchievements(next, course)
  saveGame(next)
  return next
}

export function setUsername(state: GameState, username: string): GameState {
  const next = { ...state, username: username.trim() || 'Пользователь' }
  saveGame(next)
  return next
}

/**
 * Награды за первое завершение дня курса (как один клик «Завершить день» в legacy).
 */
export function applyDayCompleteRewards(
  state: GameState,
  course: CourseProgressState,
  day: number,
  taskTitle: string | undefined,
  report: DailyReport | undefined,
  wasNew: boolean,
): GameState {
  if (!wasNew) return state

  const rewardId = `day-${day}`
  let next = updateStreakOnDayComplete(state)

  if (!next.completedRewardIds.includes(rewardId)) {
    next = addXpRaw(next, XP_PER_DAY_BASE)
    next = {
      ...next,
      completedRewardIds: [...next.completedRewardIds, rewardId],
    }
    if (taskTitle) {
      next = { ...next, skills: applyTaskTitleToSkills(next.skills, taskTitle, day) }
    }
  }

  const dayBonus = 50 + (next.streak.current || 0) * 5
  next = addXpRaw(next, dayBonus)

  next = completeDailyTask(next, 'practice')
  if (report && dailyReportWorthReportTask(report)) {
    next = completeDailyTask(next, 'report')
  }

  next = checkAchievements(next, course)
  saveGame(next)
  return next
}

/** Завершение дня: прогресс курса + игровые награды (только при первом завершении дня). */
export function completeCourseDay(day: number, report?: DailyReport, taskTitle?: string) {
  const course = loadProgress()
  const wasNew = !course.completedDays.includes(day)
  markDayComplete(day, report)
  if (!wasNew) return
  let g = loadGame()
  g = applyDayCompleteRewards(g, loadProgress(), day, taskTitle, report, true)
  saveGame(g)
}

export function applyCheckpointComplete(state: GameState, course: CourseProgressState, day: number): GameState {
  const id = `checkpoint-${day}`
  let next = state
  if (next.completedRewardIds.includes(id)) return next
  next = addXpRaw(next, 65)
  next = { ...next, completedRewardIds: [...next.completedRewardIds, id] }
  next = checkAchievements(next, course)
  saveGame(next)
  return next
}

export function completeCheckpointFlow(day: number) {
  applyCheckpointComplete(loadGame(), loadProgress(), day)
}

export function achievementDefinitionsForUi(
  g: GameState,
  course: CourseProgressState,
): { id: string; icon: string; title: string; desc: string; unlocked: boolean }[] {
  const completed = course.completedDays.length
  const level = levelFromXp(g.xp)
  const best = g.streak.best || 0
  const tests = !!(g.testResults.pillars && g.testResults.triggers)
  return [
    { id: 'first_day', icon: '🌟', title: 'Первый шаг', desc: 'Завершить день 1', unlocked: completed >= 1 },
    { id: 'week_1', icon: '📅', title: 'Неделя', desc: '7 дней пройдено', unlocked: completed >= 7 },
    { id: 'week_2', icon: '🗓️', title: 'Две недели', desc: '14 дней пройдено', unlocked: completed >= 14 },
    { id: 'halfway', icon: '⚡', title: 'Половина пути', desc: '15 дней пройдено', unlocked: completed >= 15 },
    { id: 'week_3', icon: '🏆', title: 'Три недели', desc: '21 день пройден', unlocked: completed >= 21 },
    { id: 'master', icon: '👑', title: 'Мастер курса', desc: 'Завершить курс', unlocked: completed >= 30 },
    { id: 'streak_3', icon: '🔥', title: 'Горячий старт', desc: '3 дня подряд', unlocked: best >= 3 },
    { id: 'streak_7', icon: '💪', title: 'Неделя стрик', desc: '7 дней подряд', unlocked: best >= 7 },
    { id: 'streak_14', icon: '🚀', title: 'Две недели огня', desc: '14 дней подряд', unlocked: best >= 14 },
    { id: 'level_5', icon: '⭐', title: 'Опытный', desc: 'Достичь 5 уровня', unlocked: level >= 5 },
    { id: 'level_10', icon: '🌟', title: 'Эксперт', desc: 'Набрать опыт (милестоун)', unlocked: g.totalXpEarned >= EXPERT_XP_MILESTONE },
    { id: 'tests', icon: '📊', title: 'Аналитик', desc: 'Пройти тесты столпов и триггеров', unlocked: tests },
  ]
}
