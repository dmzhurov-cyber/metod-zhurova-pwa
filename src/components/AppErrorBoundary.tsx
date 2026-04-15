import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { hasError: boolean; message: string }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="sp-main" style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
          <h1 className="sp-display" style={{ fontSize: '1.1rem', marginBottom: 12 }}>
            Сбой интерфейса
          </h1>
          <p className="sp-muted" style={{ marginBottom: 16 }}>
            Обновите страницу. Если повторяется — очистите данные сайта для этого адреса и откройте снова.
          </p>
          <button type="button" className="sp-btn-primary" onClick={() => window.location.reload()}>
            Обновить
          </button>
          {import.meta.env.DEV && (
            <pre className="sp-muted" style={{ marginTop: 16, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
              {this.state.message}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
