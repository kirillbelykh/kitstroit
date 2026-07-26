import { captureAttributionFromLocation, setYmClientId } from './attribution'

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
  window.ym?.(YM_COUNTER_ID, 'hit', url)
}

function fetchClientId() {
  if (!window.ym) return
  try {
    window.ym(YM_COUNTER_ID, 'getClientID', (clientId: string) => {
      if (clientId) {
        setYmClientId(String(clientId))
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

function bindNavigationHits() {
  if (navigationBound) return
  navigationBound = true
  const send = () => hit(currentUrl())
  window.addEventListener('hashchange', send)
  window.addEventListener('popstate', send)
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
  window.setTimeout(fetchClientId, 300)
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

export function trackLeadStart() {
  reachGoal('lead_start')
}

export function trackLeadSuccess() {
  reachGoal('lead_success')
}

export function trackFormError() {
  reachGoal('form_error')
}
