import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { CourseAccessProvider } from './context/CourseAccessContext'
import { AppErrorBoundary } from './components/AppErrorBoundary'

const baseUrl = import.meta.env.BASE_URL
const basename = baseUrl === '/' ? undefined : baseUrl.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <CourseAccessProvider>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </CourseAccessProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
