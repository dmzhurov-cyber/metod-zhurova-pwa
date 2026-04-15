import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getDayBundle, CHECKPOINT_DAYS, getPhaseForDay, getPhaseNumberForDay } from '../course/courseModel'
import { AudioPlayer } from '../components/AudioPlayer'
import { AUDIO } from '../lib/audioAssets'
import { dayVisualStyleVars } from '../course/dayVisualTheme'
import { extraSchemesForDay, schemeAssetUrl } from '../course/daySchemes'
import { buildPelvicDay17Theory, pelvicHintForDay } from '../course/day17Pelvic'
import { TheoryHtml } from '../components/TheoryHtml'
import { showToast } from '../lib/toast'
import { loadProgress } from '../lib/courseProgress'
import {
  AROUSAL_OPTIONS,
  SCALE_1_10,
  type DailyReportFormState,
  formStateFromSaved,
  fullReportFromFormState,
} from '../lib/dailyReportForm'
import { dayAtmosphereUrl } from '../lib/dayAtmosphere'
import { dayIllustrationUrl } from '../lib/dayIllustration'
import { getPtiLevelFromProfile } from '../lib/ptiFromProfile'
import { completeCourseDay, loadGame, markTheoryRead, saveGame } from '../lib/gameState'
import { useCourseAccess } from '../context/CourseAccessContext'
import { IconBookOpen, IconCheckCircle, IconChevronLeft, IconTarget } from '../components/FigmaFlowIcons'

/** Разбивает заголовок на основную часть и акцентную (курсив/cyan).
 *  Приоритет: тире "—" → двоеточие ":" → всё заглавие без акцента. */
function splitTitleAccent(title: string): { main: string; accent: string | null } {
  const t = title.trim()
  const dashIdx = t.lastIndexOf(' \u2014 ')
  if (dashIdx !== -1) {
    return { main: t.slice(0, dashIdx), accent: t.slice(dashIdx + 3) }
  }
  const colonIdx = t.indexOf(': ')
  if (colonIdx !== -1) {
    return { main: t.slice(0, colonIdx), accent: t.slice(colonIdx + 2) }
  }
  return { main: t, accent: null }
}

export function DayScreen() {
  const { day: dayParam } = useParams()
  const day = Number(dayParam)
  const bundle = useMemo(() => (Number.isFinite(day) ? getDayBundle(day) : null), [day])
  const progress = loadProgress()
  const { maxUnlockedDay: maxUnlocked, refreshTimeGate } = useCourseAccess()
  const ptiLevel = getPtiLevelFromProfile()
  const theoryHtml = useMemo(() => {
    if (!bundle) return ''
    if (day === 17) return buildPelvicDay17Theory(ptiLevel)
    return bundle.theory
  }, [bundle, day, ptiLevel])

  const pelvicHintHtml = useMemo(() => pelvicHintForDay(day, ptiLevel), [day, ptiLevel])
  const [reportForm, setReportForm] = useState<DailyReportFormState>(() =>
    formStateFromSaved(progress.dailyState[day]?.reportData),
  )

  useEffect(() => {
    setReportForm(formStateFromSaved(loadProgress().dailyState[day]?.reportData))
  }, [day])

  useEffect(() => {
    const p = loadProgress()
    if (day === p.currentDay) {
      saveGame(markTheoryRead(loadGame()))
    }
  }, [day])

  const titleParts = useMemo(() => {
    if (!bundle) return { main: '', accent: null as string | null }
    return splitTitleAccent(bundle.title)
  }, [bundle])

  if (!bundle || !Number.isFinite(day) || day < 1 || day > 30) {
    return (
      <div>
        <p className="sp-muted">День не найден.</p>
        <Link to="/app/home" className="sp-btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>
          На главную
        </Link>
      </div>
    )
  }

  const phase = getPhaseForDay(day)
  const phaseNum = getPhaseNumberForDay(day)
  const isCheckpoint = (CHECKPOINT_DAYS as readonly number[]).includes(day)
  const completed = progress.completedDays.includes(day)

  function complete() {
    if (!bundle) return
    const wasNew = !loadProgress().completedDays.includes(day)
    const prev = loadProgress().dailyState[day]?.reportData
    const report = fullReportFromFormState(reportForm, prev)
    completeCourseDay(day, report, bundle.task?.title)
    refreshTimeGate()
    showToast(
      wasNew ? 'День завершён: XP, стрик и навыки обновлены.' : 'Отчёт сохранён.',
    )
  }

  const fieldBase: CSSProperties = {
    width: '100%',
    background: 'rgba(8,12,18,0.6)',
    border: '1px solid rgba(153,247,255,0.12)',
    color: 'inherit',
    padding: '10px 12px',
    borderRadius: 10,
    fontFamily: 'inherit',
    fontSize: '0.95rem',
  }

  function patchReport<K extends keyof DailyReportFormState>(key: K, value: DailyReportFormState[K]) {
    setReportForm((f) => ({ ...f, [key]: value }))
  }

  const atmosphereIllustration = dayAtmosphereUrl(day)
  const useFigmaPlates = true

  return (
    <div
      className="day-screen-protocol"
      style={dayVisualStyleVars(day)}
      data-day={day}
      data-protocol-layout-v2="1"
    >
      <div className="day-screen-protocol-atmos" aria-hidden>
        <div
          className="day-screen-protocol-atmos-img"
          style={{ backgroundImage: `url('${atmosphereIllustration.replace(/'/g, "\\'")}')` }}
        />
        <div className="day-screen-protocol-atmos-scrim" />
      </div>
      <div className="day-screen-protocol-stack">
        {/* Герой: только иллюстрация — заголовок вынесен в карточку, без наложения текста */}
        <div className="day-hero-media">
          <Link to="/app/home" className="day-figma-back" aria-label="На главную">
            <IconChevronLeft size={24} />
          </Link>
          <img
            src={dayIllustrationUrl(day)}
            alt=""
            loading="lazy"
            className="day-hero-media-img"
          />
          <div className="day-hero-media-fade" aria-hidden />
        </div>

        <div className="sp-card day-protocol-card day-hero-title-card">
          <div className="day-hero-title-top">
            <span className="day-protocol-brand">МЖ</span>
            <span className="day-protocol-topbar-right">Метод Журова</span>
          </div>
          <div className="day-protocol-breadcrumb sp-muted" style={{ marginBottom: 10 }}>
            <Link to="/app/home">Главная</Link>
            {' · '}
            <span style={{ color: 'var(--sp-primary-from)' }}>{phase.name}</span>
          </div>
          <div className="day-figma-pill">День {day} из 30</div>
          <div className="day-protocol-phase" style={{ marginTop: 8 }}>
            Protocol phase {String(phaseNum).padStart(2, '0')}
          </div>
          <h1 className="day-hero-title-heading">
            <span>{titleParts.main}</span>
            {titleParts.accent && (
              <span className="day-protocol-title-accent">{titleParts.accent}</span>
            )}
          </h1>
          <p className="day-figma-sub" style={{ marginBottom: 0 }}>
            {phase.name}
          </p>
          {/* Голосовое вступление Джаана к этому дню */}
          <AudioPlayer
            src={AUDIO.day_intro[day as keyof typeof AUDIO.day_intro] ?? null}
            label={`Джаан · день ${day}`}
          />
        </div>

        <div className="ff-focus-card day-figma-after-hero">
          <div className="ff-focus-icon" style={{ color: '#00f1fe' }}>
            <IconTarget size={22} />
          </div>
          <div>
            <div className="ff-focus-label">Фокус дня</div>
            <p className="ff-focus-text">{bundle.report.focus}</p>
          </div>
        </div>

      {isCheckpoint && (
        <div className="sp-card day-protocol-card" style={{ marginBottom: 16 }}>
          <p className="sp-muted" style={{ marginBottom: 12 }}>
            В этот день — контрольная диагностика (4 вопроса). Пройди её отдельно, затем вернись к отчёту дня.
          </p>
          <Link to={`/app/checkpoint/${day}`} className="sp-btn-primary" style={{ textDecoration: 'none' }}>
            Пройти контрольную диагностику
          </Link>
        </div>
      )}

      {pelvicHintHtml ? (
        <div className="sp-card day-protocol-card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
          <TheoryHtml html={pelvicHintHtml} />
        </div>
      ) : null}

      <div className="day-figma-section-row">
        <span className="day-figma-section-icon" aria-hidden>
          <IconBookOpen size={22} />
        </span>
        <h2 className="day-protocol-section-title day1-scroll-target" id="figma-theory" style={{ marginBottom: 0 }}>
          {day === 17 ? 'Протокол дня (PTI)' : 'Теория дня'}
        </h2>
      </div>
      <div className={`sp-card day-protocol-card ff-section-deep${useFigmaPlates ? ' day1-theory-plate' : ''}`} style={{ marginBottom: 20 }}>
        <TheoryHtml html={theoryHtml} />
      </div>

      {extraSchemesForDay[day] && (
        <div
          className={`sp-card day-protocol-card day-scheme-plate${useFigmaPlates ? ' day1-scheme-plate' : ''}`}
          style={{ marginBottom: 20 }}
          id="figma-scheme"
        >
          <h3 className="day-protocol-section-title" style={{ marginTop: 0 }}>
            Схема дня
          </h3>
          {extraSchemesForDay[day].map((sch) => (
            <figure key={sch.file} className="day-scheme-figure">
              <figcaption className="sp-muted day-scheme-caption">{sch.name}</figcaption>
              <div className="day-scheme-svg-wrap">
                <img src={schemeAssetUrl(sch.file)} alt={sch.name} className="day-scheme-svg" loading="lazy" />
              </div>
            </figure>
          ))}
        </div>
      )}

      {bundle.task && (
        <>
          <div className="day-figma-section-row">
            <span className="day-figma-section-icon" aria-hidden>
              <IconCheckCircle size={22} />
            </span>
            <h2 className="day-protocol-section-title day1-scroll-target" id="figma-practice" style={{ marginBottom: 0 }}>
              Практика: {bundle.task.title}
            </h2>
          </div>
          <div className={`sp-card day-protocol-card ff-section-deep${useFigmaPlates ? ' day1-practice-plate' : ''}`} style={{ marginBottom: 16 }}>
            <p className="sp-muted" style={{ marginBottom: 12 }}>
              Длительность: <strong style={{ color: 'var(--sp-on-surface)' }}>{bundle.task.duration}</strong>
            </p>
            <div className="day1-practice-steps">
              {bundle.task.steps.map((s, i) => (
                <div key={i} className="day1-practice-step">
                  <span className="day1-practice-step-num">{String(i + 1).padStart(2, '0')}</span>
                  <p className="day1-practice-step-text">{s}</p>
                </div>
              ))}
            </div>
            <p
              className={useFigmaPlates ? 'day1-criterion' : undefined}
              style={{ marginTop: 16, marginBottom: 0, color: 'var(--sp-tertiary)', fontSize: '0.9rem' }}
            >
              <strong>Критерий:</strong> {bundle.task.success}
            </p>
          </div>
        </>
      )}

      <h2
        className={`day-protocol-section-title${useFigmaPlates ? ' day1-scroll-target' : ''}`}
        style={{ marginBottom: 8 }}
        id="figma-report"
      >
        Ежедневный отчёт
      </h2>
      <div className={`sp-card day-protocol-card${useFigmaPlates ? ' day1-report-plate' : ''}`} style={{ marginBottom: 16, padding: 16 }}>
        <h3 className="sp-muted" style={{ fontSize: '0.85rem', marginBottom: 12 }}>
          Метрики прогресса
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
            <span title="Время от начала стимуляции до первого ощущения приближения оргазма (ПОНР), в секундах. Твой ключевой показатель прогресса." style={{ cursor: 'help' }}>
              Время до ПОНР (сек) <span style={{ opacity: 0.4, fontSize: '0.75rem' }}>ℹ</span>
            </span>
            <input
              type="number"
              min={0}
              max={3600}
              placeholder="120"
              style={fieldBase}
              value={reportForm.currentRecord}
              onChange={(e) => patchReport('currentRecord', e.target.value)}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
            <span title="Максимальный уровень возбуждения, до которого ты доходил. 100% = оргазм. Цель — научиться удерживать 70–80% без срыва." style={{ cursor: 'help' }}>
              Макс. возбуждение (%) <span style={{ opacity: 0.4, fontSize: '0.75rem' }}>ℹ</span>
            </span>
            <select
              style={fieldBase}
              value={reportForm.arousalLevel}
              onChange={(e) => patchReport('arousalLevel', e.target.value)}
            >
              {AROUSAL_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}%
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
            <span title="Сколько раз ты останавливал стимуляцию, чтобы снизить возбуждение. Больше остановок — больше контроля." style={{ cursor: 'help' }}>
              Остановок <span style={{ opacity: 0.4, fontSize: '0.75rem' }}>ℹ</span>
            </span>
            <input
              type="number"
              min={0}
              max={50}
              placeholder="5"
              style={fieldBase}
              value={reportForm.stopsCount}
              onChange={(e) => patchReport('stopsCount', e.target.value)}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
            <span title="Насколько ты присутствовал в теле и замечал ощущения во время практики. 1 — был «в голове», 10 — полное присутствие." style={{ cursor: 'help' }}>
              Осознанность (1–10) <span style={{ opacity: 0.4, fontSize: '0.75rem' }}>ℹ</span>
            </span>
            <select
              style={fieldBase}
              value={reportForm.awareness}
              onChange={(e) => patchReport('awareness', e.target.value)}
            >
              {SCALE_1_10.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
            <span title="Насколько удавалось использовать дыхание для управления возбуждением. 1 — дыхание не работало, 10 — дыхание полностью управляло состоянием." style={{ cursor: 'help' }}>
              Контроль дыхания (1–10) <span style={{ opacity: 0.4, fontSize: '0.75rem' }}>ℹ</span>
            </span>
            <select
              style={fieldBase}
              value={reportForm.breathing}
              onChange={(e) => patchReport('breathing', e.target.value)}
            >
              {SCALE_1_10.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
            <span title="Уровень расслабленности тела во время практики. 1 — сильное напряжение, 10 — глубокое расслабление. Расслабление = ключ к контролю." style={{ cursor: 'help' }}>
              Расслабление (1–10) <span style={{ opacity: 0.4, fontSize: '0.75rem' }}>ℹ</span>
            </span>
            <select
              style={fieldBase}
              value={reportForm.relaxation}
              onChange={(e) => patchReport('relaxation', e.target.value)}
            >
              {SCALE_1_10.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>

        <h3 className="sp-muted" style={{ fontSize: '0.85rem', marginBottom: 12 }}>
          Наблюдения
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
            Триггеры (что ускоряло возбуждение)
            <textarea
              style={{ ...fieldBase, minHeight: 80, resize: 'vertical' }}
              placeholder="Физические: темп, давление… Психологические: мысли, образы… Контекст: время, место…"
              value={reportForm.triggers}
              onChange={(e) => patchReport('triggers', e.target.value)}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
            Что сработало
            <textarea
              style={{ ...fieldBase, minHeight: 64, resize: 'vertical' }}
              placeholder="Дыхание, расслабление таза, смена фокуса…"
              value={reportForm.worked}
              onChange={(e) => patchReport('worked', e.target.value)}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
            Что не сработало
            <textarea
              style={{ ...fieldBase, minHeight: 64, resize: 'vertical' }}
              placeholder="Сложности и помехи"
              value={reportForm.notworked}
              onChange={(e) => patchReport('notworked', e.target.value)}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
            {bundle.report.focus} — ваши наблюдения
            <textarea
              style={{ ...fieldBase, minHeight: 100, resize: 'vertical' }}
              placeholder={bundle.report.placeholder}
              value={reportForm.comments}
              onChange={(e) => patchReport('comments', e.target.value)}
            />
          </label>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 10 }}>
          <h3 className="sp-muted" style={{ fontSize: '0.85rem', marginBottom: 12 }}>
            Итог дня
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
              Удовлетворённость (1–10)
              <select
                style={fieldBase}
                value={reportForm.satisfaction}
                onChange={(e) => patchReport('satisfaction', e.target.value)}
              >
                {SCALE_1_10.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
              Уверенность в контроле (1–10)
              <select
                style={fieldBase}
                value={reportForm.confidence}
                onChange={(e) => patchReport('confidence', e.target.value)}
              >
                {SCALE_1_10.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          type="button"
          className="ff-btn-gradient"
          onClick={complete}
        >
          {completed ? 'Сохранить отчёт' : 'Завершить день'}
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          {day > 1 && (
            <Link to={`/app/day/${day - 1}`} className="sp-btn-ghost" style={{ textDecoration: 'none', flex: 1, minWidth: 120 }}>
              ← День {day - 1}
            </Link>
          )}
          {day < 30 &&
            (day + 1 <= maxUnlocked ? (
              <Link to={`/app/day/${day + 1}`} className="sp-btn-ghost" style={{ textDecoration: 'none', flex: 1, minWidth: 120 }}>
                День {day + 1} →
              </Link>
            ) : (
              <span className="sp-muted" style={{ flex: 1, minWidth: 120, fontSize: '0.85rem', alignSelf: 'center' }}>
                {completed ? 'День откроется в 1:00' : `Сначала завершите день ${day}`}
              </span>
            ))}
        </div>
      </div>
      </div>
    </div>
  )
}
