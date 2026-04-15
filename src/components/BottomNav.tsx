import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/app/home', label: 'Главная', icon: '⌂' },
  { to: '/app/library', label: 'Библиотека', icon: '☰' },
  { to: '/app/progress', label: 'Прогресс', icon: '◧' },
  { to: '/app/ai', label: 'ИИ-тренер', icon: '◆' },
  { to: '/app/profile', label: 'Профиль', icon: '○' },
] as const

export function BottomNav() {
  return (
    <nav className="sp-bottom-nav" aria-label="Основная навигация">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) => (isActive ? 'active' : undefined)}
          end={t.to !== '/app/library'}
        >
          <span className="sp-nav-ico" aria-hidden>
            {t.icon}
          </span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
