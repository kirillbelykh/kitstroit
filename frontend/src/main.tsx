import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminApp from './admin/AdminApp'
import Privacy from './Privacy'
import { initMetrika } from './analytics'
import './styles.css'

const LogoGlassLab = lazy(() => import('./design-lab/LogoGlassLab'))

const path = (window.location.pathname.replace(/\/+$/, '') || '/')
const isAdmin = path.startsWith('/admin')
const isPrivacy = path === '/privacy'
const isTestPage = path === '/test'

if (!isAdmin && !isTestPage) initMetrika()

const root = (() => {
  if (isAdmin) return <AdminApp />
  if (isPrivacy) return <Privacy />
  if (isTestPage) {
    return (
      <Suspense fallback={<main style={{ padding: '2rem', fontFamily: 'system-ui' }}>Загрузка…</main>}>
        <LogoGlassLab />
      </Suspense>
    )
  }
  return <App />
})()

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{root}</React.StrictMode>)
