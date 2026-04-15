import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RPG_SKILLS, TREE_LABELS } from '../game/rpgConfig'
import type { SkillNodeConfig } from '../game/rpgConfig'
import { useGame } from '../hooks/useGame'
import { levelFromXp } from '../lib/gameState'

const TREES: SkillNodeConfig['tree'][] = ['body', 'muscle', 'breath', 'focus', 'relax', 'sound']

const TREE_COLORS: Record<SkillNodeConfig['tree'], string> = {
  body: '#99f7ff',
  muscle: '#ff6b6b',
  breath: '#74b9ff',
  focus: '#a29bfe',
  relax: '#55efc4',
  sound: '#fdcb6e',
}

type SkillEntry = [string, SkillNodeConfig]

function SkillTreeCanvas({
  tree,
  entries,
  unlockedSkills,
  currentLevel,
  onSelect,
  selected,
}: {
  tree: SkillNodeConfig['tree']
  entries: SkillEntry[]
  unlockedSkills: string[]
  currentLevel: number
  onSelect: (id: string | null) => void
  selected: string | null
}) {
  const color = TREE_COLORS[tree]
  const canvasH = 340

  return (
    <div style={{ position: 'relative', width: '100%', height: canvasH, overflow: 'visible' }}>
      {/* SVG lines layer */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: canvasH, overflow: 'visible', pointerEvents: 'none' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {entries.flatMap(([id, sk]) =>
          sk.prereqs
            .filter((prereqId) => entries.some(([pid]) => pid === prereqId))
            .map((prereqId) => {
              const prereq = RPG_SKILLS[prereqId]
              if (!prereq) return null
              const fx = prereq.pos.x
              const fy = prereq.pos.y
              const tx = sk.pos.x
              const ty = sk.pos.y
              // Смещаем концы линий к краю кружочка, не сквозь него
              const dx = tx - fx
              const dy = ty - fy
              const len = Math.sqrt(dx * dx + dy * dy)
              if (len === 0) return null
              const r = 6 // радиус кружочка в единицах viewBox (≈21px из 340px высоты)
              const nx = dx / len
              const ny = dy / len
              const unlocked = unlockedSkills.includes(id)
              return (
                <line
                  key={`${prereqId}-${id}`}
                  x1={fx + nx * r}
                  y1={fy + ny * r}
                  x2={tx - nx * r}
                  y2={ty - ny * r}
                  stroke={unlocked ? color : 'rgba(255,255,255,0.15)'}
                  strokeWidth="0.8"
                  strokeDasharray={unlocked ? undefined : '2,1'}
                />
              )
            }),
        )}
      </svg>

      {/* Node circles */}
      {entries.map(([id, sk]) => {
        const unlocked = unlockedSkills.includes(id)
        const available = currentLevel >= sk.reqLevel
        const isSelected = selected === id

        const left = `${sk.pos.x}%`
        const top = `${sk.pos.y}%`

        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(isSelected ? null : id)}
            aria-label={sk.title}
            style={{
              position: 'absolute',
              left,
              top,
              transform: 'translate(-50%, -50%)',
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: `2px solid ${unlocked ? color : available ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
              background: unlocked
                ? `${color}22`
                : available
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isSelected ? `0 0 12px ${color}88` : unlocked ? `0 0 6px ${color}44` : 'none',
              transition: 'box-shadow 0.2s',
              zIndex: 2,
            }}
          >
            <i
              className={`fas ${sk.icon}`}
              style={{
                fontSize: '1rem',
                color: unlocked ? color : available ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
              }}
              aria-hidden
            />
          </button>
        )
      })}
    </div>
  )
}

export function SkillTreeScreen() {
  const game = useGame()
  const lv = levelFromXp(game.xp)
  const [activeTree, setActiveTree] = useState<SkillNodeConfig['tree']>('body')
  const [selected, setSelected] = useState<string | null>(null)

  const treeEntries = Object.entries(RPG_SKILLS).filter(
    ([, s]) => s.tree === activeTree,
  ) as SkillEntry[]

  const selectedSkill = selected ? RPG_SKILLS[selected] : null
  const selectedUnlocked = selected ? game.unlockedSkills.includes(selected) : false

  return (
    <div>
      <p className="sp-muted" style={{ marginBottom: 12 }}>
        <Link to="/app/progress">← Прогресс</Link>
      </p>
      <h1 className="sp-display" style={{ fontSize: '1.2rem', marginBottom: 4 }}>
        Дерево умений
      </h1>
      <p className="sp-muted" style={{ marginBottom: 16, fontSize: '0.85rem' }}>
        Уровень: <strong>{lv}</strong> · нажми на узел, чтобы узнать подробнее
      </p>

      {/* Tree selector tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {TREES.map((tree) => {
          const nodesUnlocked = Object.entries(RPG_SKILLS).filter(
            ([id, s]) => s.tree === tree && game.unlockedSkills.includes(id),
          ).length
          const total = Object.values(RPG_SKILLS).filter((s) => s.tree === tree).length
          const isActive = activeTree === tree
          const color = TREE_COLORS[tree]
          return (
            <button
              key={tree}
              type="button"
              onClick={() => { setActiveTree(tree); setSelected(null) }}
              style={{
                flex: '1 1 calc(33% - 6px)',
                padding: '8px 6px',
                borderRadius: 10,
                border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.12)'}`,
                background: isActive ? `${color}18` : 'rgba(255,255,255,0.04)',
                color: isActive ? color : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 400,
              }}
            >
              {TREE_LABELS[tree]}
              <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.6, marginTop: 2 }}>
                {nodesUnlocked}/{total}
              </span>
            </button>
          )
        })}
      </div>

      {/* Canvas card */}
      <div
        className="sp-card"
        style={{
          marginBottom: 16,
          padding: 16,
          borderColor: `${TREE_COLORS[activeTree]}44`,
        }}
      >
        <h2
          className="sp-display"
          style={{ fontSize: '0.95rem', marginBottom: 16, color: TREE_COLORS[activeTree] }}
        >
          {TREE_LABELS[activeTree]}
        </h2>
        <SkillTreeCanvas
          tree={activeTree}
          entries={treeEntries}
          unlockedSkills={game.unlockedSkills}
          currentLevel={lv}
          onSelect={setSelected}
          selected={selected}
        />
      </div>

      {/* Selected node detail */}
      {selectedSkill && selected && (
        <div
          className="sp-card"
          style={{
            marginBottom: 16,
            borderColor: `${TREE_COLORS[activeTree]}66`,
            background: `${TREE_COLORS[activeTree]}0d`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <i
              className={`fas ${selectedSkill.icon}`}
              style={{ fontSize: '1.3rem', color: TREE_COLORS[activeTree] }}
              aria-hidden
            />
            <div>
              <strong style={{ fontSize: '1rem' }}>{selectedSkill.title}</strong>
              <div className="sp-muted" style={{ fontSize: '0.8rem' }}>
                Требуется уровень {selectedSkill.reqLevel}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 600 }}>
              {selectedUnlocked ? (
                <span style={{ color: TREE_COLORS[activeTree] }}>✓ Разблокировано</span>
              ) : lv >= selectedSkill.reqLevel ? (
                <span className="sp-muted">Доступно</span>
              ) : (
                <span className="sp-muted">Заблокировано</span>
              )}
            </div>
          </div>
          <p className="sp-muted" style={{ fontSize: '0.9rem', margin: 0 }}>
            {selectedSkill.desc}
          </p>
          {selectedSkill.prereqs.length > 0 && (
            <p className="sp-muted" style={{ fontSize: '0.78rem', marginTop: 8 }}>
              Требует:{' '}
              {selectedSkill.prereqs.map((pid) => RPG_SKILLS[pid]?.title ?? pid).join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="sp-card" style={{ fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: `${TREE_COLORS[activeTree]}22`,
                border: `2px solid ${TREE_COLORS[activeTree]}`,
                display: 'inline-block',
              }}
            />
            Разблокировано
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '2px solid rgba(255,255,255,0.3)',
                display: 'inline-block',
              }}
            />
            Доступно
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.3)',
                border: '2px solid rgba(255,255,255,0.1)',
                display: 'inline-block',
              }}
            />
            Заблокировано
          </span>
        </div>
      </div>
    </div>
  )
}
