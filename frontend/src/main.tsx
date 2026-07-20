import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminApp from './admin/AdminApp'
import Privacy from './Privacy'
import './styles.css'

const isAdmin = window.location.pathname.startsWith('/admin')
const isPrivacy = window.location.pathname === '/privacy'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isAdmin ? <AdminApp /> : isPrivacy ? <Privacy /> : <App />}</React.StrictMode>,
)
