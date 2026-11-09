import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import jsQR from 'jsqr'
import './App.css'
import logoVera from './assets/LOGO_VERA.png'
import { firebaseAuth, firebaseConfigured } from './firebase.js'

const samples = [
  'Banco Nacional: detectamos un inicio de sesión inusual. Confirma tus datos en https://bn-colombia-seguro.co antes de 30 minutos.',
  'Hola mamá, cambié de número. Estoy en una emergencia, ¿me puedes enviar $350.000 a esta cuenta?'
]

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authReady, setAuthReady] = useState(!firebaseConfigured)
  const [content, setContent] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState(() => { try { const s = localStorage.getItem('vera_local_history'); return s ? JSON.parse(s) : []; } catch { return []; } })
  const [page, setPage] = useState('landing')
  const [support, setSupport] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [image, setImage] = useState(null)

  useEffect(() => {
    if (!firebaseAuth) return
    return onAuthStateChanged(firebaseAuth, (user) => {
      setIsAuthenticated(Boolean(user))
      setAuthReady(true)
      if (user) setPage((current) => current === 'landing' || current === 'login' || current === 'register' ? 'analizar' : current)
    })
  }, [])

  const API_BASE = import.meta.env.VITE_API_URL || ''
  const apiFetch = async (url, options = {}) => {
    const fullUrl = url.startsWith('http') ? url : API_BASE + url
    const token = await firebaseAuth?.currentUser?.getIdToken()
    const headers = { ...(options.headers || {}) }
    if (token) headers.Authorization = `Bearer ${token}`
    return fetch(fullUrl, { ...options, headers })
  }

  useEffect(() => {
    if (page !== 'historial') return;
    if (isAuthenticated && firebaseConfigured) {
      apiFetch('/api/history').then((r) => r.ok ? r.json() : null).then((data) => {
        if (data?.items?.length) {
          const formatted = data.items.map((i) => ({ ...i, time: i.createdAt ? new Date(i.createdAt).toLocaleString() : 'Reciente' }));
          setHistory(formatted);
          try { localStorage.setItem('vera_local_history', JSON.stringify(formatted.slice(0, 20))); } catch {}
        }
      }).catch(() => {});
    } else {
      try { const s = localStorage.getItem('vera_local_history'); if (s) setHistory(JSON.parse(s)); } catch {}
    }
  }, [page, isAuthenticated])

  const navigateTo = (newPage) => {
    if (!document.startViewTransition) { setPage(newPage); return }
    document.startViewTransition(() => { flushSync(() => { setPage(newPage) }) })
  }

  const fillExample = (value) => { setContent(value); setResult(null) }
  const selectImage = (file) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Selecciona una imagen PNG, JPG o WEBP de máximo 5 MB.'); return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const source = String(reader.result)
      const preview = new Image()
      preview.onload = () => {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d', { willReadFrequently: true })
        canvas.width = preview.naturalWidth; canvas.height = preview.naturalHeight
        context.drawImage(preview, 0, 0)
        const qr = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)
        setImage({ data: source.split(',')[1], mime: file.type })
        setContent(qr?.data ? `QR detectado: ${qr.data}` : `Imagen adjunta: ${file.name}`)
        setResult(null); setError('')
      }
      preview.src = source
    }
    reader.readAsDataURL(file)
  }
  const analyze = async () => {
    if (!content.trim() || loading) return
    setLoading(true); setError('')
    try {
      const response = await apiFetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: content, image }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No pudimos analizar el contenido.')
      setResult(data)
      setHistory((items) => {
        const updated = [{ ...data, excerpt: content.trim(), time: new Date().toLocaleString() }, ...items].slice(0, 20);
        try { localStorage.setItem('vera_local_history', JSON.stringify(updated)); } catch {}
        return updated;
      })
    } catch (requestError) {
      setError(requestError.message || 'No pudimos conectar con VERA.')
    } finally { setLoading(false) }
  }
  const report = async () => {
    if (!result) return
    await apiFetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level: result.level, excerpt: content }) })
    setSupport(true)
  }

  // --- Auth / Landing routing ---
  if (!authReady) return <div className="auth-loading">Cargando VERA...</div>
  if (!isAuthenticated && page === 'landing') return <LandingPage onLogin={() => navigateTo('login')} onRegister={() => navigateTo('register')} />
  if (!isAuthenticated && page === 'login')   return <AuthPage mode="login"    onBack={() => navigateTo('landing')} onSwitch={() => navigateTo('register')} onComplete={() => { setIsAuthenticated(true); navigateTo('analizar') }} />
  if (!isAuthenticated && page === 'register') return <AuthPage mode="register" onBack={() => navigateTo('landing')} onSwitch={() => navigateTo('login')}     onComplete={() => { setIsAuthenticated(true); navigateTo('analizar') }} />

  // --- Main app shell ---
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img src={logoVera} alt="VERA" className="brand-logo" /></div>
        <p className="brand-caption">Ciberseguridad para todos</p>
        <nav className="main-nav">
          <button className={`nav-item ${page === 'analizar'  ? 'active' : ''}`} onClick={() => navigateTo('analizar')}><span>⌁</span> Analizar</button>
          <button className={`nav-item ${page === 'historial' ? 'active' : ''}`} onClick={() => navigateTo('historial')}><span>◷</span> Historial <b>{history.length || ''}</b></button>
          <button className={`nav-item ${page === 'guia'      ? 'active' : ''}`} onClick={() => navigateTo('guia')}><span>✦</span> Guía de seguridad</button>
          <a href="/poster.html" target="_blank" rel="noreferrer" className="nav-item" style={{ textDecoration: 'none', color: '#38bdf8' }}><span>📑</span> Poster Expo (EN)</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <span className="lock">🔒</span>
            <div><strong>Tu privacidad importa</strong><small>Procesamos tus datos de forma segura y no los compartimos.</small></div>
          </div>
          <button className="support-link" onClick={() => setSupport(true)}><span>?</span> Centro de ayuda</button>
          <div className="user-row">
            <div className="avatar">U</div>
            <div><strong>Mi Cuenta</strong><small>Usuario protegido</small></div>
            <span className="more" onClick={async () => { if (firebaseAuth) await signOut(firebaseAuth); setIsAuthenticated(false); navigateTo('landing') }} title="Cerrar sesión">✕</span>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">VERA <span>/</span> {page === 'analizar' ? 'Nuevo análisis' : page === 'historial' ? 'Historial' : 'Aprende a protegerte'}</div>
          <div className="status"><i /> Servicio activo <span className="bell">🔔</span></div>
        </header>
        {page === 'analizar'  && <Analyze content={content} setContent={setContent} result={result} analyze={analyze} fillExample={fillExample} onImage={selectImage} onReport={report} loading={loading} error={error} image={image} />}
        {page === 'historial' && <History history={history} open={(item) => { setContent(item.excerpt); setResult(item); navigateTo('analizar') }} />}
        {page === 'guia'      && <Guide />}
      </main>
      {support && (
        <div className="modal-backdrop" onClick={() => setSupport(false)}>
          <div className="support-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSupport(false)}>×</button>
            <span className="modal-icon">?</span>
            <h2>Estamos para ayudarte</h2>
            <p>Si tienes dudas sobre un resultado, puedes reportarlo para que nuestro equipo lo revise.</p>
            <button className="analyze-button" onClick={() => setSupport(false)}>Enviar a soporte <span>→</span></button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-pages ────────────────────────────────────────────────────────────────

function Analyze({ content, setContent, result, analyze, fillExample, onImage, onReport, loading, error, image }) {
  return (
    <section className="workspace fade-in">
      <div className="intro">
        <div>
          <p className="eyebrow">ANÁLISIS INTELIGENTE <span>●</span></p>
          <h1>¿Algo no te cuadra?</h1>
          <p className="intro-copy">Cuéntame qué recibiste. Revisaré el contenido y te explicaré qué hacer, sin tecnicismos.</p>
        </div>
        <div className="shield-art"><div className="shield">✓</div><span>Protección<br />en tiempo real</span></div>
      </div>
      <div className="analysis-grid">
        <div className="composer-panel">
          <div className="panel-heading">
            <div><h2>Comparte el contenido</h2><p>Pega un mensaje, enlace o describe lo que ves.</p></div>
            <span className="secure-badge">⌁ Seguro</span>
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Ej. 'Tu cuenta será bloqueada, confirma tus datos aquí...'" maxLength="4000" />
          {image && <p className="image-attached">✓ Imagen lista para análisis de visión</p>}
          <div className="composer-footer">
            <span>{content.length}/4000</span>
            <div className="input-actions">
              <input id="evidence-image" className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onImage(e.target.files?.[0])} />
              <button onClick={() => document.getElementById('evidence-image').click()}>⊕ Adjuntar imagen</button>
              <button onClick={() => fillExample('Código QR recibido por mensaje. Revisa este enlace: https://premio-seguro.xyz')}>⌗ Escanear QR</button>
            </div>
            <button className="analyze-button" onClick={analyze} disabled={(!content.trim() && !image) || loading}>
              {loading ? 'Analizando...' : 'Analizar'} <span>{loading ? '◌' : '→'}</span>
            </button>
          </div>
          {error && <p className="api-error" role="alert">{error}</p>}
        </div>
        <div className="tips-panel">
          <h3>También puedes analizar</h3>
          <Tip icon="↗" color="blue"   title="Un enlace"       detail="Verifica si un sitio es confiable"      onClick={() => fillExample(samples[0])} />
          <Tip icon="☷" color="orange" title="Un mensaje"      detail="Detecta engaños y suplantación"         onClick={() => fillExample(samples[1])} />
          <Tip icon="▧" color="purple" title="Una imagen o QR" detail="Revisa capturas y promociones"          onClick={() => document.getElementById('evidence-image').click()} />
        </div>
      </div>
      {result ? <Result result={result} onReport={onReport} /> : (
        <div className="trust-strip">
          <span>✦</span>
          <div><strong>VERA analiza por ti</strong><p>Combinamos inteligencia artificial y señales de seguridad para darte una respuesta clara.</p></div>
          <div className="trust-stats">
            <span><b>98%</b><small>precisión</small></span>
            <span><b>&lt; 3s</b><small>respuesta</small></span>
            <span><b>24/7</b><small>disponible</small></span>
          </div>
        </div>
      )}
    </section>
  )
}

function Tip({ icon, color, title, detail, onClick }) {
  return <button onClick={onClick}><span className={`tip-icon ${color}`}>{icon}</span><span><strong>{title}</strong><small>{detail}</small></span><b>→</b></button>
}

function Result({ result, onReport }) {
  return (
    <div className={`result-card ${result.level}`}>
      <div className="result-top">
        <div className="result-symbol">{result.level === 'safe' ? '✓' : '!'}</div>
        <div>
          <span className="result-label">VEREDICTO VERA</span>
          <h2>{result.title}</h2>
          <p>{result.summary}</p>
          {result.provider && <small className="provider-note">Análisis: {result.provider}{result.consensus === 'disagreement' ? ' · hubo diferencias entre modelos' : ''}</small>}
        </div>
        <strong className="result-pill">{result.label}</strong>
      </div>
      <div className="result-body">
        <div><h3>¿Por qué?</h3><p>{result.detail}</p></div>
        <div><h3>Qué puedes hacer</h3><p>{result.action}</p></div>
      </div>
      <div className="result-actions">
        <button className="text-button" onClick={onReport}>⚑ Reportar diagnóstico dudoso</button>
        <button className="new-analysis" onClick={() => window.location.reload()}>Nuevo análisis <span>↗</span></button>
      </div>
    </div>
  )
}

function History({ history, open }) {
  return (
    <section className="subpage fade-in">
      <div className="subpage-heading">
        <div><p className="eyebrow">TUS CONSULTAS</p><h1>Historial de análisis</h1><p>Revisa tus consultas recientes y vuelve a ver las recomendaciones de VERA.</p></div>
        <div className="history-count">{history.length}<small>análisis guardados</small></div>
      </div>
      {history.length === 0
        ? <div className="empty-state"><span>◷</span><h2>Aún no tienes análisis</h2><p>Cuando revises un mensaje o enlace, aparecerá aquí.</p></div>
        : <div className="history-list">{history.map((item, i) => (
            <button key={`${item.time}-${i}`} onClick={() => open(item)} className="history-item">
              <span className={`mini-status ${item.level}`}>{item.level === 'safe' ? '✓' : '!'}</span>
              <span><strong>{item.label}</strong><small>{item.excerpt}</small></span>
              <time>{item.time}</time><b>→</b>
            </button>
          ))}</div>
      }
    </section>
  )
}

function Guide() {
  return (
    <section className="subpage guide-page fade-in">
      <div className="subpage-heading">
        <div>
          <p className="eyebrow">GUÍA OFICIAL DE CIBERSEGURIDAD Y RESPUESTA RÁPIDA</p>
          <h1>¿Sospechas de una estafa?<br /><em>Guía de acción inmediata.</em></h1>
          <p className="guide-lead">
            Los ciberdelincuentes usan la urgencia y el miedo para que actúes sin pensar. Si recibiste un mensaje dudoso o ya caíste en una trampa, aquí tienes el protocolo paso a paso para proteger tu dinero, tus datos y tus cuentas.
          </p>
        </div>
      </div>

      <div className="emergency-alert-box">
        <span className="emergency-icon">🚨</span>
        <div>
          <strong>¿Acabas de ingresar tus claves o transferir dinero a un desconocido?</strong>
          <p>
            1. Comunícate <b>de inmediato</b> con la línea de fraude de tu banco y solicita el bloqueo de productos y canales digitales.<br />
            2. Cambia tus contraseñas desde otro dispositivo seguro.<br />
            3. Radica la denuncia formal ante el CAI Virtual de la Policía Nacional.
          </p>
        </div>
      </div>

      <h2 className="guide-section-title">Protocolo de Emergencia Paso a Paso</h2>
      <div className="guide-detailed-grid">
        <article className="guide-card urgent">
          <span className="guide-badge red">Paso 1</span>
          <h3>Si diste tus claves o datos de tarjetas</h3>
          <ul>
            <li><b>Llama a tu banco ahora mismo:</b> Pide bloqueo preventivo de tarjeta débito/crédito y cambio de clave de cajero/virtual.</li>
            <li><b>Desactiva avances o transferencias:</b> En tu app bancaria oficial, reduce los topes de transferencias a $0 mientras se resuelve.</li>
            <li><b>Revisa tus movimientos:</b> Solicita al banco desconocer transacciones no autorizadas de inmediato.</li>
          </ul>
        </article>

        <article className="guide-card warning-step">
          <span className="guide-badge amber">Paso 2</span>
          <h3>Si intentan robarte tu WhatsApp</h3>
          <ul>
            <li><b>Nunca compartas códigos SMS de 6 dígitos:</b> Ninguna entidad te pedirá un código enviado por mensaje.</li>
            <li><b>Si perdiste acceso a tu cuenta:</b> Vuelve a instalar WhatsApp, ingresa tu número y solicita el código por llamada o SMS para expulsar al atacante.</li>
            <li><b>Activa la verificación en 2 pasos:</b> Abre WhatsApp &gt; Ajustes &gt; Cuenta &gt; Verificación en dos pasos y pon un PIN secreto.</li>
          </ul>
        </article>

        <article className="guide-card info-step">
          <span className="guide-badge blue">Paso 3</span>
          <h3>Si es un "Familiar en apuros"</h3>
          <ul>
            <li><b>Cuelga o detén la conversación:</b> No envíes dinero bajo presión.</li>
            <li><b>Llama al número de siempre:</b> Comunícate directamente con tu familiar por su número habitual o con personas cercanas a él/ella para confirmar si realmente está en una emergencia.</li>
            <li><b>Pídele una prueba de voz o pregunta trampa:</b> Pregunta algo íntimo que solo tu familiar sepa (como el nombre de su primera mascota).</li>
          </ul>
        </article>
      </div>

      <h2 className="guide-section-title">Líneas y Canales Oficiales de Denuncia en Colombia</h2>
      <div className="directory-grid">
        <div className="directory-card">
          <span className="dir-icon">👮‍♂️</span>
          <div>
            <strong>CAI Virtual - Policía Nacional</strong>
            <p>Atención 24/7 a delitos informáticos, estafas y suplantación.</p>
            <span className="contact-tag">Página: caivirtual.policia.gov.co | Twitter: @CAIVirtual</span>
          </div>
        </div>

        <div className="directory-card">
          <span className="dir-icon">⚖️</span>
          <div>
            <strong>Fiscalía General de la Nación</strong>
            <p>Denuncias formales de ciberdelitos a través del sistema A Denunciar.</p>
            <span className="contact-tag">Línea gratuita: 122 | adenunciar.policia.gov.co</span>
          </div>
        </div>

        <div className="directory-card">
          <span className="dir-icon">🏛️</span>
          <div>
            <strong>Superintendencia Financiera de Colombia</strong>
            <p>Verificación de entidades vigiladas y alertas por captación ilegal.</p>
            <span className="contact-tag">superfinanciera.gov.co | Línea: (601) 594 0200</span>
          </div>
        </div>

        <div className="directory-card">
          <span className="dir-icon">🏢</span>
          <div>
            <strong>Superintendencia de Industria y Comercio (SIC)</strong>
            <p>Protección del consumidor y quejas por tratamiento indebido de datos personales.</p>
            <span className="contact-tag">sic.gov.co | Línea Nacional: 01 8000 910165</span>
          </div>
        </div>
      </div>

      <h2 className="guide-section-title">Reglas de Oro de Prevención</h2>
      <div className="golden-rules-grid">
        <div className="rule-card">
          <span className="rule-number">01</span>
          <h4>El candado no significa seguro</h4>
          <p>Un sitio web con HTTPS solo significa que la conexión está cifrada, no que el dueño sea legítimo. Los estafadores también crean páginas con candado verde.</p>
        </div>
        <div className="rule-card">
          <span className="rule-number">02</span>
          <h4>Escribe tú mismo la dirección web</h4>
          <p>Nunca abras el portal de tu banco desde enlaces que te lleguen por SMS o correo. Abre tu navegador y escribe directamente bancolombia.com o davivienda.com.</p>
        </div>
        <div className="rule-card">
          <span className="rule-number">03</span>
          <h4>Cuidado con códigos QR en la calle</h4>
          <p>Los ciberdelincuentes pegan calcomanías con códigos QR falsos sobre los QR reales de parquímetros, restaurantes o pagos. Verifica que la URL destino sea oficial.</p>
        </div>
      </div>
    </section>
  )
}

// ─── Landing & Auth ───────────────────────────────────────────────────────────

function LandingPage({ onLogin, onRegister }) {
  return (
    <div className="landing-page fade-in">
      <header className="landing-header">
        <div className="brand landing-brand"><img src={logoVera} alt="VERA" className="brand-logo" /><span className="brand-name">VERA</span></div>
        <nav className="landing-nav">
          <button className="landing-login-btn" onClick={onLogin}>Iniciar sesión</button>
          <button className="analyze-button" onClick={onRegister}>Registrarse</button>
        </nav>
      </header>
      <main className="landing-main">
        <div className="landing-badge">🛡 Protección con IA</div>
        <h1 className="landing-title">Detecta estafas y<br /><span>fraudes al instante.</span></h1>
        <p className="landing-subtitle">VERA analiza mensajes, enlaces y correos sospechosos y te explica qué hacer, en segundos y sin tecnicismos.</p>
        <div className="landing-cta-group">
          <button className="analyze-button cta" onClick={onRegister}>Empieza gratis <span>→</span></button>
          <button className="landing-login-btn" onClick={onLogin}>Ya tengo cuenta</button>
        </div>
        <div className="landing-features">
          <div className="feature-card"><span>🔍</span><strong>Análisis en tiempo real</strong><small>Resultados en menos de 3 segundos</small></div>
          <div className="feature-card"><span>🤖</span><strong>IA avanzada</strong><small>Combinamos múltiples modelos de IA</small></div>
          <div className="feature-card"><span>🔒</span><strong>100% privado</strong><small>Tus datos nunca se comparten</small></div>
        </div>
      </main>
    </div>
  )
}

function AuthPage({ mode, onBack, onSwitch, onComplete }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState('')
  const isLogin = mode === 'login'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (firebaseAuth) {
        if (isLogin) await signInWithEmailAndPassword(firebaseAuth, email, password)
        else await createUserWithEmailAndPassword(firebaseAuth, email, password)
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      onComplete()
    } catch (authError) {
      setError(authError.code === 'auth/invalid-credential' ? 'Correo o contraseña incorrectos.' : authError.code === 'auth/email-already-in-use' ? 'Ese correo ya tiene una cuenta.' : authError.message || 'No pudimos iniciar sesión.')
    } finally { setBusy(false) }
  }

  return (
    <div className="auth-page fade-in">
      <button className="back-button" onClick={onBack}>← Volver</button>
      <div className="auth-card rise">
        <div className="brand auth-brand"><img src={logoVera} alt="VERA" className="brand-logo" /><span className="brand-name">VERA</span></div>
        <h2>{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta gratuita'}</h2>
        <p>{isLogin ? 'Ingresa para acceder a tu panel de seguridad.' : 'Empieza a protegerte hoy mismo.'}</p>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <label>
              Nombre completo
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Tu nombre" autoComplete="name" />
            </label>
          )}
          <label>
            Correo electrónico
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="ejemplo@correo.com" autoComplete="email" />
          </label>
          <label>
            Contraseña
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 8 caracteres" minLength={8} autoComplete={isLogin ? 'current-password' : 'new-password'} />
          </label>
          <button type="submit" className="analyze-button submit-auth" disabled={busy}>
            {busy ? 'Cargando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'} {!busy && <span>→</span>}
          </button>
          {error && <p className="api-error" role="alert">{error}</p>}
        </form>
        <p className="auth-switch">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <b onClick={onSwitch}>{isLogin ? ' Regístrate gratis' : ' Inicia sesión'}</b>
        </p>
      </div>
    </div>
  )
}

export default App
