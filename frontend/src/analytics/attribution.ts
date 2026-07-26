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
  ym_client_id?: string | null
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

export type AttributionStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

const LIMITS = {
  utm: 200,
  yclid: 128,
  url: 500,
  cta: 120,
  clientId: 64,
  timestamp: 40,
} as const

function browserStorage(): AttributionStorage {
  return {
    getItem: (key) => {
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value)
      } catch {
        // Ignore quota / private mode failures — lead still works without persistence.
      }
    },
  }
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max)
}

function asCleanString(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return truncate(trimmed, max)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function sanitizeTouch(value: unknown): TouchAttribution | undefined {
  if (!isPlainObject(value)) return undefined
  const touch: TouchAttribution = {}
  for (const key of UTM_KEYS) {
    const cleaned = asCleanString(value[key], LIMITS.utm)
    if (cleaned) touch[key] = cleaned
  }
  const yclid = asCleanString(value.yclid, LIMITS.yclid)
  if (yclid) touch.yclid = yclid
  const landing = asCleanString(value.landing_page, LIMITS.url)
  if (landing) touch.landing_page = landing
  const referrer = asCleanString(value.referrer, LIMITS.url)
  if (referrer) touch.referrer = referrer
  const timestamp = asCleanString(value.timestamp, LIMITS.timestamp)
  if (timestamp) touch.timestamp = timestamp
  return touch
}

export function sanitizeStoredAttribution(value: unknown): StoredAttribution {
  if (!isPlainObject(value)) return {}
  const store: StoredAttribution = {}
  const first = sanitizeTouch(value.first)
  if (first) store.first = first
  const last = sanitizeTouch(value.last)
  if (last) store.last = last
  const clientId = asCleanString(value.ym_client_id, LIMITS.clientId)
  if (clientId) store.ym_client_id = clientId
  const cta = asCleanString(value.cta, LIMITS.cta)
  if (cta) store.cta = cta
  return store
}

export function readStore(storage: AttributionStorage = browserStorage()): StoredAttribution {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return sanitizeStoredAttribution(JSON.parse(raw))
  } catch {
    return {}
  }
}

export function writeStore(value: StoredAttribution, storage: AttributionStorage = browserStorage()) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(sanitizeStoredAttribution(value)))
  } catch {
    // Ignore persistence failures.
  }
}

export function pickParams(search: string): Partial<TouchAttribution> {
  const params = new URLSearchParams(search.startsWith('?') || search === '' ? search : `?${search}`)
  const touch: Partial<TouchAttribution> = {}
  for (const key of UTM_KEYS) {
    const value = asCleanString(params.get(key), LIMITS.utm)
    if (value) touch[key] = value
  }
  const yclid = asCleanString(params.get('yclid'), LIMITS.yclid)
  if (yclid) touch.yclid = yclid
  return touch
}

export function hasTrafficParams(touch: Partial<TouchAttribution>) {
  return Boolean(touch.yclid || UTM_KEYS.some((key) => touch[key]))
}

export function setPendingCta(cta: string, storage: AttributionStorage = browserStorage()) {
  const cleaned = asCleanString(cta, LIMITS.cta)
  if (!cleaned) return
  const store = readStore(storage)
  store.cta = cleaned
  writeStore(store, storage)
}

export function setYmClientId(clientId: string, storage: AttributionStorage = browserStorage()) {
  const cleaned = asCleanString(clientId, LIMITS.clientId)
  if (!cleaned) return
  const store = readStore(storage)
  store.ym_client_id = cleaned
  writeStore(store, storage)
}

export function getStoredYmClientId(storage: AttributionStorage = browserStorage()): string | null {
  return readStore(storage).ym_client_id ?? null
}

export function applyCapture(
  store: StoredAttribution,
  href: string,
  referrer: string,
  originFallback = 'https://kitstroit.ru',
): StoredAttribution {
  let url: URL
  try {
    url = new URL(href, originFallback)
  } catch {
    return store
  }
  const params = pickParams(url.search)
  const now = new Date().toISOString()
  const landing = asCleanString(`${url.origin}${url.pathname}${url.search}`, LIMITS.url)
  const ref = asCleanString(referrer, LIMITS.url)
  const next: StoredAttribution = { ...store }

  if (!next.first) {
    next.first = {
      ...params,
      landing_page: landing,
      referrer: ref,
      timestamp: now,
    }
  }

  if (hasTrafficParams(params)) {
    next.last = {
      ...params,
      landing_page: landing,
      referrer: ref,
      timestamp: now,
    }
  }

  return sanitizeStoredAttribution(next)
}

export function captureAttributionFromLocation(
  href = typeof window !== 'undefined' ? window.location.href : '',
  referrer = typeof document !== 'undefined' ? document.referrer : '',
  storage: AttributionStorage = browserStorage(),
) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kitstroit.ru'
  const next = applyCapture(readStore(storage), href, referrer, origin)
  writeStore(next, storage)
  return next
}

function pickField(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const cleaned = asCleanString(value, LIMITS.url)
    if (cleaned) return cleaned
  }
  return undefined
}

export function buildLeadAttribution(
  store: StoredAttribution,
  options: { pageUrl?: string; documentReferrer?: string } = {},
): LeadAttribution {
  const first = store.first ?? {}
  const last = store.last ?? {}
  const payload: LeadAttribution = {
    ym_client_id: asCleanString(store.ym_client_id, LIMITS.clientId) ?? null,
    yclid: asCleanString(last.yclid || first.yclid, LIMITS.yclid),
    landing_page: asCleanString(first.landing_page, LIMITS.url),
    referrer: pickField(options.documentReferrer, last.referrer, first.referrer),
    page_url: asCleanString(options.pageUrl, LIMITS.url),
    cta: asCleanString(store.cta, LIMITS.cta),
    utm_source: asCleanString(last.utm_source || first.utm_source, LIMITS.utm),
    utm_medium: asCleanString(last.utm_medium || first.utm_medium, LIMITS.utm),
    utm_campaign: asCleanString(last.utm_campaign || first.utm_campaign, LIMITS.utm),
    utm_content: asCleanString(last.utm_content || first.utm_content, LIMITS.utm),
    utm_term: asCleanString(last.utm_term || first.utm_term, LIMITS.utm),
    first_utm_source: asCleanString(first.utm_source, LIMITS.utm),
    first_utm_medium: asCleanString(first.utm_medium, LIMITS.utm),
    first_utm_campaign: asCleanString(first.utm_campaign, LIMITS.utm),
    first_utm_content: asCleanString(first.utm_content, LIMITS.utm),
    first_utm_term: asCleanString(first.utm_term, LIMITS.utm),
    first_landing_page: asCleanString(first.landing_page, LIMITS.url),
    first_referrer: asCleanString(first.referrer, LIMITS.url),
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === null) return true // explicit null for missing ClientID is allowed
      return value != null && value !== ''
    }),
  ) as LeadAttribution
}

export function getLeadAttribution(storage: AttributionStorage = browserStorage()): LeadAttribution {
  return buildLeadAttribution(readStore(storage), {
    pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    documentReferrer: typeof document !== 'undefined' ? document.referrer : undefined,
  })
}
