import { checkReputation, inspectRedirects } from './reputation.js'
import { askConfiguredProviders } from './providers.js'

const MAX_TEXT_LENGTH = 4000
const urgentSignals = [
  'urgente', 'inmediatamente', 'premio', 'ganaste', 'contraseña', 'confirma tus datos',
  'antes de 30', 'envía', 'envie', 'transferencia', 'emergencia', 'código de verificación',
  'codigo de verificacion', 'suspendida', 'bloqueada', 'inhabilitada', 'embargo',
  'familiar', 'hijo', 'mama', 'mamá', 'papa', 'papá', 'cambie de numero', 'cambié de número',
  'nuevo numero', 'nuevo número', 'accidente', 'hospital', 'retenido', 'multa', 'dian',
  'servientrega', 'clave dinamica', 'clave dinámica', 'token', 'actualiza tus datos',
  'desbloquear', 'devolución', 'devolucion', 'reembolso', 'lotería', 'loteria',
  'trabaja desde casa', 'gana dinero', 'dar likes', 'tarea completada', 'paquete no entregado',
  'aduana', 'costo de envio', 'simit', 'fotomulta', 'comparendo', 'embargo de cuenta',
  'devolucion de iva', 'renta ciudadana', 'ingreso solidario', 'inversion garantizada',
  'piramide', 'cripto', 'recupera tu inversion', 'hijo detenido', 'fiscalia'
]
const linkSignals = ['http://', 'https://', '.xyz', '.top', '.click', '.live', '.online', '.site', '.vip', 'bit.ly', 'tinyurl', 't.co', 'cutt.ly', 'linktr.ee', 'wa.me']
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
  { domain: 'davivienda.com', name: 'Banco Davivienda' },
  { domain: 'bbva.com.co', name: 'BBVA Colombia' },
  { domain: 'bancodebogota.com', name: 'Banco de Bogotá' },
  { domain: 'colpatria.com', name: 'Scotiabank Colpatria' },
  { domain: 'bancopopular.com.co', name: 'Banco Popular' },
  { domain: 'bancoagrario.gov.co', name: 'Banco Agrario' },
  { domain: 'daviplata.com', name: 'Daviplata' },
  { domain: 'nequi.com.co', name: 'Nequi' },
  { domain: 'gov.co', name: 'Gobierno de Colombia' },
  { domain: 'policia.gov.co', name: 'Policía Nacional de Colombia' },
  { domain: 'dian.gov.co', name: 'DIAN' },
  { domain: 'simit.org.co', name: 'SIMIT' },
  { domain: 'interrapidisimo.com', name: 'Inter Rapidísimo' },
  { domain: 'coordinadora.com', name: 'Coordinadora' }
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
  const hasMoneyRequest = /\$|pesos|transfer|consign|env[ií]a dinero|plata|necesito plata/.test(normalized)

  // Specific Fraud Category Patterns
  const isFamilyScam = /(mam[aá]|pap[aá]|hijo|t[ií]o|familiar|hermano|abuelo).*?(emergencia|cambi[eé]|n[uú]mero|nuevo n[uú]mero|accidente|plata|dinero|transfer|consign)/i.test(normalized)
  const isBankScam = /(bancolombia|davivienda|nequi|daviplata|bbva|banco|colpatria|portal financiero).*?(bloque|suspen|inval|actualiz|clave|token|dinamica|embargo|verific)/i.test(normalized)
  const isPackageScam = /(servientrega|4-72|inter\s*rapid[ií]simo|coordinadora|envia|paquete|aduana|fedex|dhl).*?(reten|costo|pago|gu[ií]a|reenv[ií]o|flete|entrega)/i.test(normalized)
  const isJobScam = /(gana|trabajo|empleo|ingreso|tarea|vacante).*?(diario|semanal|casa|inversi[oó]n|likes|telegram|youtube|medio tiempo)/i.test(normalized)
  const isFineScam = /(simit|fotomulta|comparendo|tr[aá]nsito|polic[ií]a nacional).*?(notifica|pag[oó]|descuento|infracci[oó]n|mandamiento)/i.test(normalized)

  if (isFamilyScam) {
    return {
      level: 'danger',
      label: 'Peligroso',
      title: 'Modalidad de estafa: "Familiar en apuros"',
      summary: 'Detectamos el patrón clásico donde un atacante finge ser tu hijo, mamá o familiar diciendo que cambió de número para pedir dinero urgente.',
      detail: 'Los delincuentes compran chips o usan números desconocidos, inventan un accidente o pérdida de teléfono y apelan al cariño familiar para que transfieras dinero sin pensar.',
      action: 'NO transfieras ni un peso. Cuelga y llama directamente al número telefónico que siempre has tenido de tu familiar para confirmar su estado.',
      signals: [...signals, 'suplantación familiar', 'solicitud de dinero urgente']
    }
  }

  if (isBankScam) {
    return {
      level: 'danger',
      label: 'Peligroso',
      title: 'Posible suplantación bancaria (Smishing / Phishing)',
      summary: 'El mensaje imita una alerta de seguridad de tu banco para asustarte y robar tus claves o token.',
      detail: 'Las entidades financieras oficiales NUNCA te enviarán enlaces para "desbloquear" cuentas ni te pedirán tu clave dinámica por mensaje o WhatsApp.',
      action: 'No abras ningún enlace ni entregues códigos. Si tienes dudas, abre directamente la aplicación oficial de tu banco o llama a la línea de atención al cliente.',
      signals: [...signals, 'alerta bancaria engañosa']
    }
  }

  if (isPackageScam) {
    return {
      level: 'danger',
      label: 'Peligroso',
      title: 'Falso paquete o entrega retenida',
      summary: 'Suplantación de empresas de mensajería solicitando pagos pequeños para robar los datos de tu tarjeta.',
      detail: 'Las empresas de logística no te pedirán ingresar a páginas dudosas a pagar "tasas de aduana" ni liberaciones de paquetes que no has pedido.',
      action: 'No hagas clic en el enlace ni ingreses datos de tarjetas de crédito o débito.',
      signals: [...signals, 'falsa paquetería retenida']
    }
  }

  if (isJobScam) {
    return {
      level: 'danger',
      label: 'Peligroso',
      title: 'Falsa oferta de empleo / Tareas remuneradas',
      summary: 'Engaño de ingresos rápidos por dar likes o completar tareas en Telegram/WhatsApp.',
      detail: 'Inician pagando pequeñas sumas para ganar tu confianza y luego te exigen depositar dinero en supuestas plataformas de inversión que retienen tus fondos.',
      action: 'Bloquea el remitente y no consignes dinero. Los trabajos legítimos nunca te piden pagar para trabajar.',
      signals: [...signals, 'falsa oferta laboral / esquema piramidal']
    }
  }

  if (isFineScam) {
    return {
      level: 'danger',
      label: 'Peligroso',
      title: 'Falsa notificación de fotomulta o comparendo',
      summary: 'Intento de fraude haciéndose pasar por el SIMIT o autoridades de tránsito.',
      detail: 'Los mensajes que amenazan con embargos inmediatos por multas suelen descargar malware o redirigir a pasarelas de pago falsas.',
      action: 'Verifica tus infracciones ingresando tú mismo a www.fcm.org.co/simit.',
      signals: [...signals, 'falsa citación de tránsito']
    }
  }

  const danger = signals.length >= 2 || links.risky.length > 0 || (hasLink && signals.length > 0) || (hasMoneyRequest && signals.length > 0)
  if (danger) return { level: 'danger', label: 'Peligroso', title: 'No interactúes con este mensaje', summary: 'Encontramos señales claras de una posible estafa digital.', detail: links.risky.length > 0 ? 'El enlace usa un protocolo inseguro o imita el nombre de un servicio legítimo. El candado por sí solo no demuestra que el sitio sea auténtico.' : 'El mensaje combina presión de tiempo, solicitud de datos o dinero y señales de suplantación.', action: 'No abras enlaces, no respondas y repórtalo. Si compartiste información, contacta hoy mismo a tu banco.', signals }
  if (signals.length > 0 || links.unknown.length > 0 || hasMoneyRequest) return { level: 'warning', label: 'Sospechoso', title: 'Revísalo antes de continuar', summary: 'Hay señales que merecen una verificación adicional.', detail: 'El contenido usa un enlace no reconocido o una solicitud poco habitual. Confirma por un canal oficial que la persona o entidad realmente envió este mensaje.', action: 'No ingreses claves ni datos. Busca el sitio oficial escribiendo su dirección directamente.', signals }
  if (links.trusted.length > 0) return { level: 'safe', label: 'Probablemente seguro', title: 'El dominio parece legítimo', summary: `El enlace pertenece a ${links.trusted[0].organization}, según su dominio.`, detail: 'La dirección usa HTTPS y un dominio oficial reconocido. Esto valida el dominio, pero no garantiza el contenido, archivo o identidad del remitente.', action: 'Puedes abrirlo con precaución. No descargues archivos inesperados ni ingreses claves si el sitio te redirige a otro dominio.', signals: [] }
  return { level: 'safe', label: 'Probablemente seguro', title: 'No vemos señales de estafa', summary: 'El contenido parece normal, pero mantén tus hábitos de seguridad.', detail: 'No encontramos lenguaje de urgencia, solicitudes de dinero ni enlaces con señales evidentes de riesgo.', action: 'Continúa con normalidad y evita compartir códigos o contraseñas.', signals: [] }
}
function imageFallback(hasImage) {
  return {
    level: 'warning',
    label: 'Sospechoso',
    title: 'Captura recibida bajo revisión preventiva',
    summary: 'La imagen fue recibida y evaluada con el motor preventivo de VERA.',
    detail: 'Al no contener texto identificable o no tener un modelo de visión por OCR activo, VERA aplica el principio de máxima precaución. Las capturas de comprobantes de pago o códigos QR no verificados suelen utilizarse para suplantación de identidad.',
    action: 'No confíes en capturas de pantalla de transferencias bancarias hasta verificar el saldo real en tu aplicación del banco. Si la imagen incluye un código QR, no lo escanees.',
    signals: ['captura o imagen sin texto explícito']
  }
}

export async function analyzeWithAI(text, env, image) {
  const urlsInText = extractUrls(text)
  const isGenericImagePlaceholder = image && (!text || text.startsWith('Imagen adjunta:'))
  const fallback = (image && !urlsInText.length && isGenericImagePlaceholder) ? imageFallback(true) : heuristicAnalysis(text)
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
