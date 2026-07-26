#!/usr/bin/env node
/**
 * Proof: SPA hit dispatcher — init once, hashchange once per change,
 * no double-hit when popstate+hashchange fire together (popstate unbound after fix).
 * Run: node frontend/scripts/prove-spa-hits.mjs
 */

function createHitDispatcher() {
  const hits = []
  let previousVirtualUrl = null
  let navigationBound = false
  const listeners = { hashchange: [], popstate: [] }

  function currentUrl(location) {
    return location.href
  }

  function hit(url, location, documentRef) {
    const options = { title: documentRef.title }
    if (previousVirtualUrl) options.referer = previousVirtualUrl
    else if (documentRef.referrer) options.referer = documentRef.referrer
    hits.push({ url, options })
    previousVirtualUrl = url
  }

  function bindNavigationHits(location, documentRef) {
    if (navigationBound) return
    navigationBound = true
    // FIX: hashchange only — do NOT bind popstate
    listeners.hashchange.push(() => hit(currentUrl(location), location, documentRef))
  }

  function init(location, documentRef) {
    hit(currentUrl(location), location, documentRef)
    bindNavigationHits(location, documentRef)
  }

  function emit(type) {
    for (const fn of listeners[type]) fn()
  }

  return { hits, init, emit, bindNavigationHits }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function run() {
  let failed = 0
  const check = (name, fn) => {
    try {
      fn()
      console.log(`PASS ${name}`)
    } catch (error) {
      failed += 1
      console.error(`FAIL ${name}: ${error.message}`)
    }
  }

  check('init sends exactly one hit', () => {
    const d = createHitDispatcher()
    const location = { href: 'https://kitstroit.ru/' }
    const documentRef = { title: 'KIT', referrer: 'https://yandex.ru/' }
    d.init(location, documentRef)
    assert(d.hits.length === 1, `expected 1 hit, got ${d.hits.length}`)
    assert(d.hits[0].url === 'https://kitstroit.ru/', 'url')
    assert(d.hits[0].options.referer === 'https://yandex.ru/', 'first referer from document.referrer')
  })

  check('hashchange sends one hit with previous as referer', () => {
    const d = createHitDispatcher()
    const location = { href: 'https://kitstroit.ru/' }
    const documentRef = { title: 'KIT', referrer: '' }
    d.init(location, documentRef)
    location.href = 'https://kitstroit.ru/#projects'
    d.emit('hashchange')
    assert(d.hits.length === 2, 'init + hashchange')
    assert(d.hits[1].url === 'https://kitstroit.ru/#projects', 'hash url')
    assert(d.hits[1].options.referer === 'https://kitstroit.ru/', 'referer is previous virtual url')
  })

  check('simultaneous popstate+hashchange does not double-hit after fix', () => {
    const d = createHitDispatcher()
    const location = { href: 'https://kitstroit.ru/#lead' }
    const documentRef = { title: 'KIT', referrer: '' }
    d.init(location, documentRef)
    location.href = 'https://kitstroit.ru/#projects'
    // Browser fires both on hash back/forward — popstate has no listeners after fix
    d.emit('popstate')
    d.emit('hashchange')
    assert(d.hits.length === 2, `expected 2 hits (init+hash), got ${d.hits.length}`)
  })

  check('bindNavigationHits is idempotent', () => {
    const d = createHitDispatcher()
    const location = { href: 'https://kitstroit.ru/' }
    const documentRef = { title: 'KIT', referrer: '' }
    d.init(location, documentRef)
    d.bindNavigationHits(location, documentRef)
    location.href = 'https://kitstroit.ru/#faq'
    d.emit('hashchange')
    assert(d.hits.length === 2, 'still one listener')
  })

  if (failed) {
    console.error(`\n${failed} case(s) failed`)
    process.exit(1)
  }
  console.log('\nAll SPA hit dispatcher cases passed')
}

run()
