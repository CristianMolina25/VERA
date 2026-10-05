import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT
let services = null

if (projectId) {
  const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const options = credentials ? { credential: cert(JSON.parse(credentials)), projectId } : { credential: applicationDefault(), projectId }
  const app = getApps()[0] || initializeApp(options)
  services = { auth: getAuth(app), db: getFirestore(app) }
}

export function firebaseServices() { return services }

export async function authenticate(request) {
  const configured = Boolean(services)
  const required = process.env.NODE_ENV === 'production' || process.env.REQUIRE_AUTH === 'true'
  const header = request.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!configured) {
    if (required) throw Object.assign(new Error('Firebase Auth no está configurado.'), { status: 503 })
    return { uid: 'local-anonymous', authenticated: false }
  }
  if (!token) {
    if (required) throw Object.assign(new Error('Inicia sesión para usar VERA.'), { status: 401 })
    return { uid: 'local-anonymous', authenticated: false }
  }
  try {
    const decoded = await services.auth.verifyIdToken(token)
    return { uid: decoded.uid, authenticated: true }
  } catch {
    throw Object.assign(new Error('La sesión expiró. Inicia sesión nuevamente.'), { status: 401 })
  }
}

export async function storeAnalysis(uid, payload) {
  if (!services) return null
  const document = { ...payload, uid, createdAt: FieldValue.serverTimestamp() }
  const ref = await services.db.collection('analyses').add(document)
  return ref.id
}

export async function readAnalyses(uid, limit = 20) {
  if (!services) return []
  const snapshot = await services.db.collection('analyses').where('uid', '==', uid).orderBy('createdAt', 'desc').limit(limit).get()
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.().toISOString() || null }))
}

export async function storeReport(uid, payload) {
  if (!services) return null
  const ref = await services.db.collection('reports').add({ ...payload, uid, status: 'pending', createdAt: FieldValue.serverTimestamp() })
  return ref.id
}
