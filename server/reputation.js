import dns from 'node:dns/promises'
import net from 'node:net'

const MAX_REDIRECTS = 3
const privateRanges = [
  /^127\./, /^10\./, /^192\.168\./, /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./, /^0\./, /^::1$/, /^fc/i, /^fd/i, /^fe80/i,
]

function isPrivateAddress(address) {
  return privateRanges.some((range) => range.test(address))
}

export async function isPublicUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return false
    if (net.isIP(url.hostname)) return !isPrivateAddress(url.hostname)
    const addresses = await dns.lookup(url.hostname, { all: true })
    return addresses.length > 0 && addresses.every(({ address }) => !isPrivateAddress(address))
  } catch {
    return false
  }
}

export async function inspectRedirects(urls, env) {
  if (env.CHECK_REDIRECTS !== 'true') return []
  const results = []
  for (const original of urls.slice(0, 3)) {
    if (!(await isPublicUrl(original))) {
      results.push({ url: original, risk: 'blocked', detail: 'Destino no público o no verificable' })
      continue
    }
    let current = original
    let redirects = 0
    try {
      while (redirects < MAX_REDIRECTS) {
        const response = await fetch(current, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(4000) })
        if (![301, 302, 303, 307, 308].includes(response.status)) break
        const location = response.headers.get('location')
        if (!location) break
        const next = new URL(location, current).toString()
        if (!(await isPublicUrl(next))) {
          results.push({ url: original, risk: 'danger', detail: 'Redirige a un destino privado o no verificable' })
          current = null
          break
        }
        current = next
        redirects += 1
      }
      if (current) results.push({ url: original, finalUrl: current, redirects, risk: redirects >= MAX_REDIRECTS ? 'warning' : 'clean' })
    } catch {
      results.push({ url: original, risk: 'unknown', detail: 'No se pudo comprobar la redirección' })
    }
  }
  return results
}

async function googleSafeBrowsing(urls, key) {
  if (!key || urls.length === 0) return []
  const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000),
    body: JSON.stringify({ client: { clientId: 'vera', clientVersion: '1.0' }, threatInfo: { threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'], platformTypes: ['ANY_PLATFORM'], threatEntryTypes: ['URL'], threatEntries: urls.map((url) => ({ url })) } }),
  })
  if (!response.ok) throw new Error(`Safe Browsing ${response.status}`)
  const data = await response.json()
  return (data.matches || []).map((match) => ({ url: match.threat?.url, source: 'Google Safe Browsing', risk: 'danger', detail: match.threatType }))
}

async function virusTotal(urls, key) {
  if (!key || urls.length === 0) return []
  const results = []
  for (const url of urls.slice(0, 3)) {
    const id = Buffer.from(url).toString('base64url')
    const response = await fetch(`https://www.virustotal.com/api/v3/urls/${id}`, { headers: { 'x-apikey': key }, signal: AbortSignal.timeout(5000) })
    if (!response.ok) continue
    const data = await response.json()
    const stats = data.data?.attributes?.last_analysis_stats || {}
    if (stats.malicious > 0 || stats.suspicious > 0) results.push({ url, source: 'VirusTotal', risk: 'danger', detail: `${stats.malicious || 0} motores maliciosos` })
  }
  return results
}

export async function checkReputation(urls, env) {
  const publicUrls = []
  for (const url of urls.slice(0, 3)) if (await isPublicUrl(url)) publicUrls.push(url)
  const checks = await Promise.allSettled([googleSafeBrowsing(publicUrls, env.GOOGLE_SAFE_BROWSING_KEY), virusTotal(publicUrls, env.VIRUSTOTAL_API_KEY)])
  return checks.flatMap((check) => check.status === 'fulfilled' ? check.value : [])
}
