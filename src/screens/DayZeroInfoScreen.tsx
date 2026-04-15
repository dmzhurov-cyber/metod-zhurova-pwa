import { Link } from 'react-router-dom'
import { DAY_ZERO_THEORY_HTML } from '../course/dayZeroTheory'
import { TheoryHtml } from '../components/TheoryHtml'

export function DayZeroInfoScreen() {
  return (
    <div>
      <p className="sp-muted" style={{ marginBottom: 12 }}>
        <Link to="/app/library">Библиотека</Link>
      </p>
      <h1 className="sp-display" style={{ fontSize: '1.15rem', marginBottom: 12 }}>
        Диагностика — отправная точка
      </h1>
      <div className="sp-card course-theory-html">
        <TheoryHtml html={DAY_ZERO_THEORY_HTML} />
      </div>
      <p className="sp-muted" style={{ marginTop: 16 }}>
        Сама расширенная диагностика и PTI проходят при первом входе (экран «Стартовая диагностика»).
      </p>
    </div>
  )
}
