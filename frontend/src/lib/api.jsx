import { useAuth } from '../contexts/AuthContext.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    const error = new Error(data?.detail || response.statusText || 'Request failed')
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}

export async function apiRequest(path, { method = 'GET', body, skipAuth = false, headers = {} } = {}) {
  const url = `${API_BASE}${path}`
  let token
  if (!skipAuth) {
    const stored = localStorage.getItem('documind_tokens')
    if (stored) {
      const tokens = JSON.parse(stored)
      token = tokens.access_token
      headers.Authorization = `Bearer ${token}`
    }
  }

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(body)
  }

  try {
    return await fetchJson(url, { method, body, headers })
  } catch (error) {
    if (error.status === 401 && !skipAuth) {
      const stored = localStorage.getItem('documind_tokens')
      if (!stored) throw error
      const tokens = JSON.parse(stored)
      const refreshResponse = await fetchJson(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      })
      localStorage.setItem('documind_tokens', JSON.stringify({ ...tokens, ...refreshResponse }))
      headers.Authorization = `Bearer ${refreshResponse.access_token}`
      return await fetchJson(url, { method, body, headers })
    }
    throw error
  }
}

export function createSSE(url, { token, onMessage, onError, onComplete }) {
  const eventSource = new EventSource(url, { withCredentials: false })
  eventSource.onmessage = (event) => {
    onMessage(event.data)
  }
  eventSource.onerror = (err) => {
    onError(err)
    eventSource.close()
  }
  eventSource.onopen = () => {
    // no-op
  }
  return eventSource
}
