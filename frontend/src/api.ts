const API_ROOT = import.meta.env.VITE_API_URL ?? '/api'

export type LeadPayload = {
  name: string
  phone: string
  project_type: string
  message?: string
  consent: true
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

export const sendLead = (payload: LeadPayload) =>
  api<{ id: number }>('/leads', { method: 'POST', body: JSON.stringify(payload) })
