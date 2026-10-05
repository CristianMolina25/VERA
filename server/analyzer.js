import { checkReputation, inspectRedirects } from './reputation.js'
import { askConfiguredProviders } from './providers.js'

const MAX_TEXT_LENGTH = 4000
const urgentSignals = ['urgente', 'inmediatamente', 'premio', 'ganaste', 'contraseña', 'confirma tus datos', 'antes de 30', 'envía', 'envie', 'transferencia', 'emergencia', 'código de verificación', 'suspendida', 'bloqueada']
const linkSignals = ['http://', 'https://', '.xyz', '.top', '.click', 'bit.ly', 'tinyurl']
const trustedDomains = [
  { domain: 'sharepoint.com', name: 'Microsoft SharePoint' },
  { domain: 'onedrive.com', name: 'Microsoft OneDrive' },
  { domain: 'microsoft.com', name: 'Microsoft' },
  { domain: 'youtube.com', name: 'YouTube' },
  { domain: 'youtu.be', name: 'YouTube' },
  { domain: 'google.com', name: 'Google' },
  { domain: 'googleusercontent.com', name: 'Google' },
  { domain: 'unilibre.edu.co', name: 'Universidad Libre' },
  { domain: 'whatsapp.com', name: 'WhatsApp' },
  { domain: 'facebook.com', name: 'Facebook' },
  { domain: 'instagram.com', name: 'Instagram' },
  { domain: 'twitter.com', name: 'Twitter' },
  { domain: 'x.com', name: 'X (Twitter)' },
  { domain: 'apple.com', name: 'Apple' },
  { domain: 'amazon.com', name: 'Amazon' },
  { domain: 'netflix.com', name: 'Netflix' },
  { domain: 'paypal.com', name: 'PayPal' },
  { domain: 'mercadolibre.com', name: 'Mercado Libre' },
  { domain: 'mercadopago.com', name: 'Mercado Pago' },
  { domain: 'bancolombia.com', name: 'Bancolombia' },
  { domain: 'daviplata.com', name: 'Daviplata' },
  { domain: 'nequi.com.co', name: 'Nequi' },
  { domain: 'gov.co', name: 'Gobierno de Colombia' },
]

export function extractUrls(text) {
  return [...text.matchAll(/https?:\/\/[^\s<>{}"'`]+/gi)].map((match) => match[0].replace(/[),.;!?]+$/, ''))
}
function matchesDomain(hostname, domain) { return hostname === domain || hostname.endsWith(`.${domain}`) }
export function inspectUrls(text) {
  return extractUrls(text).map((value) => {
    try {
      const url = new URL(value)
      const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
      const trusted = trustedDomains.find(({ domain }) => matchesDomain(hostname, domain))
      const imitatesTrusted = !trusted && trustedDomains.some(({ domain }) => hostname.includes(domain.split('.')[0]))
      const shortener = ['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly'].some((domain) => matchesDomain(hostname, domain))
      return { value, hostname, protocol: url.protocol, trusted: Boolean(trusted), organization: trusted?.name || null, risk: url.protocol !== 'https:' || imitatesTrusted ? 'danger' : shortener ? 'warning' : trusted ? 'trusted' : 'unknown' }
    } catch { return { value, hostname: null, protocol: null, trusted: false, organization: null, risk: 'danger' } }
  })
}
function urlContext(text) {
  const urls = inspectUrls(text)
  return { urls, trusted: urls.filter((url) => url.risk === 'trusted'), risky: urls.filter((url) => url.risk === 'danger'), unknown: urls.filter((url) => url.risk === 'unknown' || url.risk === 'warning') }
}
export function redactSensitiveData(input) { return input.replace(/\b(?:\d[ -]?){13,19}\b/g, '[TARJETA REDACTADA]').replace(/\b\d{7,12}\b/g, '[NUMERO REDACTADO]').replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[CORREO REDACTADO]') }

export function heuristicAnalysis(text) {
  const normalized = text.toLowerCase()
  const signals = urgentSignals.filter((signal) => normalized.includes(signal))
  const links = urlContext(text)
  const hasLink = links.urls.length > 0 || linkSignals.some((signal) => normalized.includes(signal))
  const hasMoneyRequest = /\$|pesos|transfer|consign|env[ií]a dinero/.test(normalized)
  const danger = signals.length >= 2 || links.risky.length > 0 || (hasLink && signals.length > 0) || (hasMoneyRequest && signals.length > 0)
  if (danger) return { level: 'danger', label: 'Peligroso', title: 'No interactúes con este mensaje', summary: 'Encontramos señales claras de una posible estafa digital.', detail: links.risky.length > 0 ? 'El enlace usa un protocolo inseguro o imita el nombre de un servicio legítimo. El candado por sí solo no demuestra que el sitio sea auténtico.' : 'El mensaje combina presión de tiempo, solicitud de datos o dinero y señales de suplantación.', action: 'No abras enlaces, no respondas y repórtalo. Si compartiste información, contacta hoy mismo a tu banco.', signals }
  if (signals.length > 0 || links.unknown.length > 0 || hasMoneyRequest) return { level: 'warning', label: 'Sospechoso', title: 'Revísalo antes de continuar', summary: 'Hay señales que merecen una verificación adicional.', detail: 'El contenido usa un enlace no reconocido o una solicitud poco habitual. Confirma por un canal oficial que la persona o entidad realmente envió este mensaje.', action: 'No ingreses claves ni datos. Busca el sitio oficial escribiendo su dirección directamente.', signals }
  if (links.trusted.length > 0) return { level: 'safe', label: 'Probablemente seguro', title: 'El dominio parece legítimo', summary: `El enlace pertenece a ${links.trusted[0].organization}, según su dominio.`, detail: 'La dirección usa HTTPS y un dominio oficial reconocido. Esto valida el dominio, pero no garantiza el contenido, archivo o identidad del remitente.', action: 'Puedes abrirlo con precaución. No descargues archivos inesperados ni ingreses claves si el sitio te redirige a otro dominio.', signals: [] }
  return { level: 'safe', label: 'Probablemente seguro', title: 'No vemos señales de estafa', summary: 'El contenido parece normal, pero mantén tus hábitos de seguridad.', detail: 'No encontramos lenguaje de urgencia, solicitudes de dinero ni enlaces con señales evidentes de riesgo.', action: 'Continúa con normalidad y evita compartir códigos o contraseñas.', signals: [] }
}
function imageFallback() { return { level: 'warning', label: 'Sospechoso', title: 'Necesitamos revisar la imagen', summary: 'La captura se recibió, pero no hay un motor de visión configurado.', detail: 'VERA no debe adivinar el contenido de una imagen. Activa un modelo compatible con visión para leer texto, códigos QR y señales visuales.', action: 'No abras enlaces ni compartas datos hasta que la imagen pueda ser revisada.', signals: ['imagen pendiente de OCR'] } }

export async function analyzeWithAI(text, env, image) {
  const fallback = image ? imageFallback() : heuristicAnalysis(text)
  const links = urlContext(text)
  try {
    const redirects = await inspectRedirects(links.urls.map((url) => url.value), env)
    const reputation = await checkReputation(links.urls.map((url) => url.value), env)
    const externalDanger = [...redirects, ...reputation].some((item) => item.risk === 'danger')
    if (externalDanger) return { ...fallback, level: 'danger', label: 'Peligroso', title: 'El enlace tiene una alerta externa', summary: 'Una fuente de reputación encontró señales de riesgo.', detail: 'El enlace fue marcado por una verificación de seguridad o intenta redirigir a un destino no confiable.', action: 'No abras el enlace, no descargues archivos y repórtalo.', reputation, redirects, provider: 'reputation-guardrail' }
    const opinions = await askConfiguredProviders(text, { urls: links.urls, redirects, reputation, hasImage: Boolean(image) }, env, image)
    if (opinions.length === 0) return { ...fallback, reputation, redirects, provider: 'heuristic' }
    const hasDanger = opinions.some((opinion) => opinion.level === 'danger')
    const hasWarning = opinions.some((opinion) => opinion.level === 'warning')
    const level = links.risky.length > 0 || hasDanger ? 'danger' : hasWarning ? 'warning' : fallback.level
    const chosen = opinions.find((opinion) => opinion.level === level) || opinions[0]
    const disagreement = new Set(opinions.map((opinion) => opinion.level)).size > 1
    const guarded = links.trusted.length > 0 && links.unknown.length === 0 && !hasDanger && fallback.level === 'safe'
    const result = guarded ? fallback : { ...chosen, level, label: level === 'danger' ? 'Peligroso' : level === 'warning' ? 'Sospechoso' : 'Probablemente seguro' }
    return { ...result, reputation, redirects, provider: opinions.map((opinion) => opinion.provider).join(' + '), providers: opinions.map(({ provider, level: opinionLevel }) => ({ provider, level: opinionLevel })), consensus: disagreement ? 'disagreement' : 'agreement' }
  } catch { return { ...fallback, provider: 'heuristic-fallback', providerError: 'unavailable' } }
}

export function validateText(value) {
  if (typeof value !== 'string') return { ok: false, message: 'El contenido debe ser texto.' }
  const text = value.trim()
  if (text.length < 3) return { ok: false, message: 'Comparte al menos tres caracteres para analizar.' }
  if (text.length > MAX_TEXT_LENGTH) return { ok: false, message: `El contenido no puede superar ${MAX_TEXT_LENGTH} caracteres.` }
  return { ok: true, text }
}
