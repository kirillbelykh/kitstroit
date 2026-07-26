const STORAGE_KEY = 'kit_attribution_v1'

export type TouchAttribution = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  yclid?: string
  landing_page?: string
  referrer?: string
  timestamp?: string
}

export type StoredAttribution = {
  first?: TouchAttribution
  last?: TouchAttribution
  ym_client_id?: string
  cta?: string
}

export type LeadAttribution = {
  ym_client_id?: string
  yclid?: string
  landing_page?: string
  referrer?: string
  page_url?: string
  cta?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  first_utm_source?: string
  first_utm_medium?: string
  first_utm_campaign?: string
  first_utm_content?: string
  first_utm_term?: string
  first_landing_page?: string
  first_referrer?: string
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

function readStore(): StoredAttribution {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as StoredAttribution
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(value: StoredAttribution) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Ignore quota / private mode failures — lead still works without persistence.
  }
}

function pickParams(search: string): Partial<TouchAttribution> {
  const params = new URLSearchParams(search)
  const touch: Partial<TouchAttribution> = {}
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim()
    if (value) touch[key] = value
  }
  const yclid = params.get('yclid')?.trim()
  if (yclid) touch.yclid = yclid
  return touch
}

function hasTrafficParams(touch: Partial<TouchAttribution>) {
  return Boolean(touch.yclid || UTM_KEYS.some((key) => touch[key]))
}

export function setPendingCta(cta: string) {
  const store = readStore()
  store.cta = cta.slice(0, 120)
  writeStore(store)
}

export function setYmClientId(clientId: string) {
  if (!clientId) return
  const store = readStore()
  store.ym_client_id = clientId.slice(0, 64)
  writeStore(store)
}

export function captureAttributionFromLocation(href = window.location.href, referrer = document.referrer) {
  const url = new URL(href, window.location.origin)
  const params = pickParams(url.search)
  const store = readStore()
  const now = new Date().toISOString()
  const landing = `${url.origin}${url.pathname}${url.search}`

  if (!store.first) {
    store.first = {
      ...params,
      landing_page: landing,
      referrer: referrer || undefined,
      timestamp: now,
    }
  }

  if (hasTrafficParams(params)) {
    store.last = {
      ...params,
      landing_page: landing,
      referrer: referrer || undefined,
      timestamp: now,
    }
  }

  writeStore(store)
  return store
}

export function getLeadAttribution(): LeadAttribution {
  const store = readStore()
  const first = store.first ?? {}
  const last = store.last ?? {}
  const payload: LeadAttribution = {
    ym_client_id: store.ym_client_id,
    yclid: last.yclid || first.yclid,
    landing_page: first.landing_page,
    referrer: document.referrer || last.referrer || first.referrer,
    page_url: window.location.href,
    cta: store.cta,
    utm_source: last.utm_source || first.utm_source,
    utm_medium: last.utm_medium || first.utm_medium,
    utm_campaign: last.utm_campaign || first.utm_campaign,
    utm_content: last.utm_content || first.utm_content,
    utm_term: last.utm_term || first.utm_term,
    first_utm_source: first.utm_source,
    first_utm_medium: first.utm_medium,
    first_utm_campaign: first.utm_campaign,
    first_utm_content: first.utm_content,
    first_utm_term: first.utm_term,
    first_landing_page: first.landing_page,
    first_referrer: first.referrer,
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value != null && value !== ''),
  ) as LeadAttribution
}
