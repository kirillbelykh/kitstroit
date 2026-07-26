#!/usr/bin/env node
/**
 * Proof: attribution first/last-touch rules + sanitization (mirrors attribution.ts).
 * Run: node frontend/scripts/prove-attribution.mjs
 */

const STORAGE_KEY = 'kit_attribution_v1'
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
const LIMITS = { utm: 200, yclid: 128, url: 500, cta: 120, clientId: 64, timestamp: 40 }

function createMemoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed))
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)) },
    _map: map,
  }
}

function truncate(value, max) {
  return value.length <= max ? value : value.slice(0, max)
}

function asCleanString(value, max) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return truncate(trimmed, max)
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function sanitizeTouch(value) {
  if (!isPlainObject(value)) return undefined
  const touch = {}
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

function sanitizeStoredAttribution(value) {
  if (!isPlainObject(value)) return {}
  const store = {}
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

function readStore(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return sanitizeStoredAttribution(JSON.parse(raw))
  } catch {
    return {}
  }
}

function writeStore(value, storage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(sanitizeStoredAttribution(value)))
}

function pickParams(search) {
  const params = new URLSearchParams(search.startsWith('?') || search === '' ? search : `?${search}`)
  const touch = {}
  for (const key of UTM_KEYS) {
    const value = asCleanString(params.get(key), LIMITS.utm)
    if (value) touch[key] = value
  }
  const yclid = asCleanString(params.get('yclid'), LIMITS.yclid)
  if (yclid) touch.yclid = yclid
  return touch
}

function hasTrafficParams(touch) {
  return Boolean(touch.yclid || UTM_KEYS.some((key) => touch[key]))
}

function applyCapture(store, href, referrer, originFallback = 'https://kitstroit.ru') {
  let url
  try {
    url = new URL(href, originFallback)
  } catch {
    return store
  }
  const params = pickParams(url.search)
  const now = new Date().toISOString()
  const landing = asCleanString(`${url.origin}${url.pathname}${url.search}`, LIMITS.url)
  const ref = asCleanString(referrer, LIMITS.url)
  const next = { ...store }

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

function capture(storage, href, referrer = '') {
  const next = applyCapture(readStore(storage), href, referrer)
  writeStore(next, storage)
  return next
}

function buildLeadAttribution(store, options = {}) {
  const first = store.first ?? {}
  const last = store.last ?? {}
  const payload = {
    ym_client_id: asCleanString(store.ym_client_id, LIMITS.clientId) ?? null,
    yclid: asCleanString(last.yclid || first.yclid, LIMITS.yclid),
    landing_page: asCleanString(first.landing_page, LIMITS.url),
    referrer: asCleanString(options.documentReferrer || last.referrer || first.referrer, LIMITS.url),
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
      if (value === null) return true
      return value != null && value !== ''
    }),
  )
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function run() {
  const failures = []
  const check = (name, fn) => {
    try {
      fn()
      console.log(`PASS ${name}`)
    } catch (error) {
      failures.push(name)
      console.error(`FAIL ${name}: ${error.message}`)
    }
  }

  check('1 first visit with UTM sets first AND last', () => {
    const storage = createMemoryStorage()
    const store = capture(storage, 'https://kitstroit.ru/?utm_source=yandex&utm_campaign=brand&yclid=abc123')
    assert(store.first?.utm_source === 'yandex', 'first utm_source')
    assert(store.first?.utm_campaign === 'brand', 'first campaign')
    assert(store.first?.yclid === 'abc123', 'first yclid')
    assert(store.last?.utm_source === 'yandex', 'last utm_source')
    assert(store.last?.yclid === 'abc123', 'last yclid')
  })

  check('2 later different UTM keeps first, updates last', () => {
    const storage = createMemoryStorage()
    capture(storage, 'https://kitstroit.ru/?utm_source=yandex&utm_campaign=first')
    const store = capture(storage, 'https://kitstroit.ru/?utm_source=google&utm_campaign=retarget')
    assert(store.first?.utm_source === 'yandex', 'first preserved')
    assert(store.first?.utm_campaign === 'first', 'first campaign preserved')
    assert(store.last?.utm_source === 'google', 'last updated')
    assert(store.last?.utm_campaign === 'retarget', 'last campaign updated')
  })

  check('3 direct visit without UTM/yclid does not wipe first or last', () => {
    const storage = createMemoryStorage()
    capture(storage, 'https://kitstroit.ru/?utm_source=yandex&utm_campaign=paid')
    const before = readStore(storage)
    const after = capture(storage, 'https://kitstroit.ru/')
    assert(after.first?.utm_source === before.first?.utm_source, 'first untouched')
    assert(after.last?.utm_source === before.last?.utm_source, 'last untouched')
  })

  check('4 yclid saved and included in getLeadAttribution', () => {
    const storage = createMemoryStorage()
    capture(storage, 'https://kitstroit.ru/?yclid=yclid-42&utm_source=direct-like')
    const store = readStore(storage)
    store.ym_client_id = 'client-99'
    writeStore(store, storage)
    const payload = buildLeadAttribution(readStore(storage), { pageUrl: 'https://kitstroit.ru/#lead' })
    assert(payload.yclid === 'yclid-42', 'yclid in payload')
    assert(payload.ym_client_id === 'client-99', 'client id in payload')
    assert(payload.utm_source === 'direct-like', 'utm in payload')
  })

  check('5 corrupted localStorage is sanitized safely', () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: 'not-json' })
    assert(Object.keys(readStore(storage)).length === 0, 'invalid json -> empty')

    storage.setItem(STORAGE_KEY, JSON.stringify(['array']))
    assert(Object.keys(readStore(storage)).length === 0, 'array root ignored')

    storage.setItem(STORAGE_KEY, JSON.stringify({
      first: 'bad',
      last: { utm_source: 123, yclid: 'ok', landing_page: 'x'.repeat(600) },
      ym_client_id: { nested: true },
      cta: '  go  ',
    }))
    const cleaned = readStore(storage)
    assert(!cleaned.first, 'invalid first dropped')
    assert(cleaned.last?.yclid === 'ok', 'yclid kept')
    assert(!cleaned.last?.utm_source, 'non-string utm dropped')
    assert(cleaned.last?.landing_page?.length === 500, 'url truncated')
    assert(!cleaned.ym_client_id, 'non-string client id dropped')
    assert(cleaned.cta === 'go', 'cta trimmed')

    // write should not throw
    writeStore(cleaned, storage)
    capture(storage, 'https://kitstroit.ru/?utm_source=safe')
  })

  if (failures.length) {
    console.error(`\n${failures.length} scenario(s) failed`)
    process.exit(1)
  }
  console.log('\nAll attribution scenarios passed')
}

run()
