import http from 'node:http'
import { analyzeWithAI, redactSensitiveData, validateText } from './analyzer.js'
import { saveReport } from './reports.js'
import { authenticate, firebaseServices, readAnalyses, storeAnalysis } from './firebase.js'

const port = Number(process.env.PORT || 8787)
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'
const attempts = new Map()
const WINDOW_MS = 60_000
const MAX_REQUESTS = 30

function headers() {
  return { 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Content-Type': 'application/json; charset=utf-8' }
}
function send(response, status, body) { response.writeHead(status, headers()); response.end(JSON.stringify(body)) }
function clientKey(request) { return request.headers['x-forwarded-for']?.split(',')[0] || request.socket.remoteAddress || 'unknown' }
function allowed(request) {
  const now = Date.now(); const key = clientKey(request); const current = attempts.get(key) || { count: 0, start: now }
  if (now - current.start > WINDOW_MS) { attempts.set(key, { count: 1, start: now }); return true }
  current.count += 1; attempts.set(key, current); return current.count <= MAX_REQUESTS
}
function readBody(request, limit = 8 * 1024 * 1024) { return new Promise((resolve, reject) => { let data = ''; request.on('data', (chunk) => { data += chunk; if (data.length > limit) reject(new Error('payload-too-large')) }); request.on('end', () => resolve(data)); request.on('error', reject) }) }
function parseImage(value) {
  if (!value) return null
  if (typeof value.data !== 'string' || !['image/png', 'image/jpeg', 'image/webp'].includes(value.mime)) throw new Error('invalid-image')
  if (value.data.length > 7 * 1024 * 1024) throw new Error('image-too-large')
  return { data: value.data, mime: value.mime }
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return send(response, 204, {})
  if (request.method === 'GET' && request.url === '/') return send(response, 200, { service: 'VERA API', status: 'online', routes: { health: 'GET /api/health', analyze: 'POST /api/analyze', report: 'POST /api/report' }, frontend: 'http://localhost:5173' })
  if (request.method === 'GET' && request.url === '/api/health') return send(response, 200, { ok: true, service: 'vera-api', aiConfigured: Boolean(process.env.AI_API_KEY || process.env.GEMINI_API_KEY), firebaseConfigured: Boolean(firebaseServices()), providers: { chatgpt: Boolean(process.env.AI_API_KEY), gemini: Boolean(process.env.GEMINI_API_KEY) } })
  if (request.method === 'GET' && request.url === '/api/history') {
    try {
      const identity = await authenticate(request)
      return send(response, 200, { items: await readAnalyses(identity.uid) })
    } catch (error) { return send(response, error.status || 500, { error: error.message }) }
  }
  if (request.method === 'POST' && request.url === '/api/report') {
    try {
      const identity = await authenticate(request)
      const body = JSON.parse(await readBody(request, 100_000))
      const report = await saveReport({ level: body.level, excerpt: redactSensitiveData(String(body.excerpt || '').slice(0, 1000)), reason: String(body.reason || 'diagnostico-dudoso').slice(0, 100) }, identity.uid)
      return send(response, 201, { ok: true, ...report })
    } catch (error) {
      return send(response, error.status || 400, { error: error.status ? error.message : 'No pudimos guardar el reporte.' })
    }
  }
  if (request.method !== 'POST' || request.url !== '/api/analyze') return send(response, 404, { error: 'Ruta no encontrada.' })
  if (!allowed(request)) return send(response, 429, { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' })

  try {
    const body = JSON.parse(await readBody(request))
    const identity = await authenticate(request)
    const image = parseImage(body.image)
    const validation = validateText(body.text || (image ? 'Imagen adjunta para análisis' : ''))
    if (!validation.ok) return send(response, 400, { error: validation.message })
    const safeText = redactSensitiveData(validation.text)
    const result = await analyzeWithAI(safeText, process.env, image)
    const analysisId = await storeAnalysis(identity.uid, { excerpt: safeText.slice(0, 1000), level: result.level, label: result.label, title: result.title, summary: result.summary, detail: result.detail, action: result.action, provider: result.provider, consensus: result.consensus || null, signals: result.signals || [] })
    return send(response, 200, { ...result, analysisId, privacy: 'sensitive-data-redacted' })
  } catch (error) {
    return send(response, error.status || 400, { error: error.status ? error.message : 'No pudimos procesar el contenido. Intenta de nuevo.' })
  }
})

server.listen(port, () => console.log(`VERA API listening on http://localhost:${port}`))
