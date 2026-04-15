import type { ReactNode } from 'react'

type Props = {
  /** Правая колонка: шаг онбординга, счётчик вопросов и т.п. */
  right?: ReactNode
  className?: string
}

/** Липкий хедер: Метод Журова */
export function FigmaFlowHeader({ right, className = '' }: Props) {
  return (
    <header className={`ff-sticky-head ${className}`.trim()}>
      <div className="ff-sticky-head-inner">
        <div>
          <div className="ff-sticky-brand">МЖ</div>
          <div className="ff-sticky-sub">Метод Журова</div>
        </div>
        {right != null ? <div className="ff-sticky-right">{right}</div> : null}
      </div>
    </header>
  )
}
