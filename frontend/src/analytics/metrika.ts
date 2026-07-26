import {
  captureAttributionFromLocation,
  getStoredYmClientId,
  setYmClientId,
} from './attribution'

export const YM_COUNTER_ID = Number(import.meta.env.VITE_YM_COUNTER_ID || 111044314)

type YmFunction = ((...args: unknown[]) => void) & {
  a?: unknown[]
  l?: number
}

declare global {
  interface Window {
    ym?: YmFunction
  }
}

let initialized = false
let navigationBound = false
let clientIdRetries = 0
let previousVirtualUrl: string | null = null
let clientIdWaiters: Array<(id: string | null) => void> = []

const TAG_SRC = 'https://mc.yandex.ru/metrika/tag.js'

function ensureYmStub() {
  if (typeof window.ym === 'function') return
  const ym: YmFunction = (...args: unknown[]) => {
    ym.a = ym.a || []
    ym.a.push(args)
  }
  ym.l = Date.now()
  window.ym = ym
}

function injectTagScript() {
  if (document.querySelector(`script[src="${TAG_SRC}"]`)) return
  const script = document.createElement('script')
  script.async = true
  script.src = TAG_SRC
  const first = document.getElementsByTagName('script')[0]
  first?.parentNode?.insertBefore(script, first)
}

function currentUrl() {
  return window.location.href
}

function hit(url = currentUrl()) {
  const options: { title: string; referer?: string } = {
    title: document.title,
  }
  if (previousVirtualUrl) options.referer = previousVirtualUrl
  else if (document.referrer) options.referer = document.referrer

  window.ym?.(YM_COUNTER_ID, 'hit', url, options)
  previousVirtualUrl = url
}

function resolveClientIdWaiters(clientId: string | null) {
  const waiters = clientIdWaiters
  clientIdWaiters = []
  for (const resolve of waiters) resolve(clientId)
}

function fetchClientId() {
  if (!window.ym) return
  try {
    window.ym(YM_COUNTER_ID, 'getClientID', (clientId: string) => {
      if (clientId) {
        setYmClientId(String(clientId))
        resolveClientIdWaiters(String(clientId))
        return
      }
      retryClientId()
    })
  } catch {
    retryClientId()
  }
}

function retryClientId() {
  if (clientIdRetries >= 8) return
  clientIdRetries += 1
  window.setTimeout(fetchClientId, Math.min(250 * 2 ** (clientIdRetries - 1), 4000))
}

/** Hash-only SPA virtual pageviews (no popstate — browsers fire both on hash back/forward). */
function bindNavigationHits() {
  if (navigationBound) return
  navigationBound = true
  window.addEventListener('hashchange', () => hit(currentUrl()))
}

/**
 * Wait up to maxMs for Metrika ClientID. Resolves null on timeout / no ym / adblock.
 * Never invents IDs and never rejects (safe for form submit).
 */
export function awaitYmClientId(maxMs = 1000): Promise<string | null> {
  const stored = getStoredYmClientId()
  if (stored) return Promise.resolve(stored)
  if (!window.ym || maxMs <= 0) return Promise.resolve(null)

  return new Promise((resolve) => {
    let settled = false
    const finish = (id: string | null) => {
      if (settled) return
      settled = true
      resolve(id)
    }

    clientIdWaiters.push(finish)
    fetchClientId()

    window.setTimeout(() => {
      const latest = getStoredYmClientId()
      // Remove this waiter if still pending
      clientIdWaiters = clientIdWaiters.filter((w) => w !== finish)
      finish(latest)
    }, maxMs)
  })
}

export function reachGoal(goal: string, params?: Record<string, string | number | boolean>) {
  if (!goal || !window.ym) return
  if (params) window.ym(YM_COUNTER_ID, 'reachGoal', goal, params)
  else window.ym(YM_COUNTER_ID, 'reachGoal', goal)
}

export function initMetrika() {
  if (initialized || !Number.isFinite(YM_COUNTER_ID) || YM_COUNTER_ID <= 0) return
  initialized = true
  captureAttributionFromLocation()
  ensureYmStub()
  injectTagScript()
  window.ym?.(YM_COUNTER_ID, 'init', {
    defer: true,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  })
  hit(currentUrl())
  bindNavigationHits()
  fetchClientId()
}

export function trackPhoneClick() {
  reachGoal('phone_click')
}

export function trackTelegramClick() {
  reachGoal('telegram_click')
}

export function trackCtaClick(cta: string) {
  reachGoal('cta_click', { cta })
}

export function trackProjectOpen(index: number) {
  reachGoal('project_open', { project_index: index + 1 })
}

export function trackVideoStart(label?: string) {
  reachGoal('video_start', label ? { title: label } : undefined)
}

export function trackFaqOpen(question: string, faqIndex: number) {
  const truncated = question.length > 120 ? question.slice(0, 120) : question
  reachGoal('faq_open', { faq_index: faqIndex, question: truncated })
}

export function trackLeadStart() {
  reachGoal('lead_start')
}

export function trackLeadSuccess() {
  reachGoal('lead_success')
}

export function trackFormError() {
  reachGoal('form_error')
}
