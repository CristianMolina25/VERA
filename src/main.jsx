import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('VERA caught an unhandled error:', error, errorInfo)
  }

  handleReset = () => {
    // Clear any potentially corrupted storage and reload cleanly
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) reg.unregister()
        })
      }
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const k of keys) caches.delete(k)
        })
      }
    } catch {}
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#f8fafc',
          padding: '24px',
          textAlign: 'center',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            background: 'rgba(56, 189, 248, 0.1)',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center'
          }}>🛡️</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#f8fafc' }}>
            VERA necesita recargarse
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '420px', lineHeight: '1.6', marginBottom: '24px' }}>
            Hubo un cambio reciente en la aplicación o en la conexión. Pulsa el botón para actualizar a la última versión.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              background: '#0ea5e9',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
            }}
          >
            Actualizar y recargar ⟳
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
