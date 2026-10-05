import { appendFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { storeReport } from './firebase.js'

const reportFile = resolve(process.env.REPORTS_FILE || 'data/reports.ndjson')

export async function saveReport(payload, uid = 'local-anonymous') {
  const firestoreId = await storeReport(uid, payload)
  if (firestoreId) return { id: firestoreId, storage: 'firestore' }
  await mkdir(dirname(reportFile), { recursive: true })
  const record = { id: crypto.randomUUID(), uid, createdAt: new Date().toISOString(), ...payload }
  await appendFile(reportFile, `${JSON.stringify(record)}\n`, 'utf8')
  return { id: record.id, createdAt: record.createdAt }
}
