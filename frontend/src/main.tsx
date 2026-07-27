import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminApp from './admin/AdminApp'
import Privacy from './Privacy'
import { initMetrika } from './analytics'
import { isLabPath } from './design-lab/lab-variants'
import './styles.css'

const MaddockEditorialLab = lazy(() => import('./design-lab/MaddockEditorialLab'))
const CraftLab = lazy(() => import('./design-lab/CraftLab'))
const SignatureLab = lazy(() => import('./design-lab/SignatureLab'))
const SignatureCanvasLab = lazy(() => import('./design-lab/SignatureCanvasLab'))
const NordicLab = lazy(() => import('./design-lab/NordicLab'))
const LedgerLab = lazy(() => import('./design-lab/LedgerLab'))
const LogoGlassLab = lazy(() => import('./design-lab/LogoGlassLab'))

const path = window.location.pathname.replace(/\/+$/, '') || '/'
const isAdmin = path.startsWith('/admin')
const isPrivacy = path === '/privacy'
const isLab = isLabPath(path)

if (!isAdmin && !isLab) initMetrika()

const labFallback = (
  <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>Загрузка design lab…</main>
)

function labPage() {
  switch (path) {
    case '/test':
      return <MaddockEditorialLab />
    case '/design-lab/craft':
      return <CraftLab />
    case '/design-lab/signature':
      return <SignatureLab />
    case '/design-lab/signature-canvas':
      return <SignatureCanvasLab />
    case '/design-lab/nordic':
      return <NordicLab />
    case '/design-lab/ledger':
      return <LedgerLab />
    case '/design-lab/logo-glass':
      return <LogoGlassLab />
    default:
      return (
        <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
          <p>Неизвестный design-lab маршрут.</p>
          <a href="/test">Maddock Editorial</a>
        </main>
      )
  }
}

const root = (() => {
  if (isAdmin) return <AdminApp />
  if (isPrivacy) return <Privacy />
  if (isLab) {
    return <Suspense fallback={labFallback}>{labPage()}</Suspense>
  }
  return <App />
})()

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{root}</React.StrictMode>)
