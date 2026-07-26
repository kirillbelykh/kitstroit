const API_ROOT = import.meta.env.VITE_API_URL ?? '/api'

export type LeadPayload = {
  name: string
  phone: string
  project_type: string
  message?: string
  consent: true
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

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new Error(detail?.detail ?? 'Не удалось выполнить запрос')
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function sendLead(payload: LeadPayload): Promise<{ id: number }> {
  const response = await fetch(`${API_ROOT}/leads`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (response.status !== 201) {
    const detail = await response.json().catch(() => null)
    const message = typeof detail?.detail === 'string'
      ? detail.detail
      : 'Не удалось отправить заявку'
    throw new Error(message)
  }

  return response.json() as Promise<{ id: number }>
}
