import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function preprocess(html: string): string {
  return html
    .replace(/onclick="openLibraryAndShowTheory\('([^']+)'\)"/g, 'data-lib="$1"')
    .replace(/onclick="showDiagnosticTest\([^)]*\)"/g, '')
    .replace(/<button([^>]*)\s+onclick="[^"]*"/g, '<button type="button"$1')
}

export function TheoryHtml({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const body = useMemo(() => preprocess(html), [html])

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-lib]')
      if (el) {
        e.preventDefault()
        const id = el.getAttribute('data-lib')
        if (id) navigate(`/app/library/theory/${encodeURIComponent(id)}`)
      }
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [navigate, body])

  return <div ref={ref} className="course-theory-html" dangerouslySetInnerHTML={{ __html: body }} />
}
