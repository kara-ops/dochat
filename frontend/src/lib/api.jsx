const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

let inMemoryAccessToken = null

export function setAccessToken(token) {
  inMemoryAccessToken = token
}

export function getAccessToken() {
  return inMemoryAccessToken
}

async function fetchJson(url, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (inMemoryAccessToken && !options.skipAuth) {
    defaultHeaders['Authorization'] = `Bearer ${inMemoryAccessToken}`
  }

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
    credentials: 'include', // Ensure httpOnly refresh cookies are sent/received
  })

  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch (err) {
    data = { detail: text }
  }

  if (!response.ok) {
    const error = new Error(
      (typeof data?.detail === 'string' ? data.detail : null) ||
        data?.message ||
        response.statusText ||
        'Request failed'
    )
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}

export async function apiRequest(path, { method = 'GET', body, skipAuth = false, headers = {} } = {}) {
  const url = `${API_BASE}${path}`

  let options = {
    method,
    headers,
    skipAuth,
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  try {
    return await fetchJson(url, options)
  } catch (error) {
    // Handle 401 Unauthorized by attempting a token refresh
    if (error.status === 401 && !skipAuth && !path.includes('/auth/refresh') && !path.includes('/auth/login')) {
      try {
        const refreshData = await fetchJson(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          skipAuth: true,
        })
        const newAccess = refreshData.access_token || refreshData.access
        if (newAccess) {
          setAccessToken(newAccess)
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${newAccess}`,
          }
          return await fetchJson(url, options)
        }
      } catch (refreshErr) {
        setAccessToken(null)
        throw refreshErr
      }
    }
    throw error
  }
}

// Auth API Calls
export const loginApi = (email, password) =>
  apiRequest('/auth/login', { method: 'POST', body: { email, password }, skipAuth: true })

export const signUpApi = (email, password) =>
  apiRequest('/auth/create-user', { method: 'POST', body: { email, password }, skipAuth: true })

export const logoutApi = () =>
  apiRequest('/auth/logout', { method: 'POST' })

export const refreshTokenApi = () =>
  apiRequest('/auth/refresh', { method: 'POST', skipAuth: true })

export const getSessionsApi = () =>
  apiRequest('/auth/get-session', { method: 'GET' })

export const resetPasswordApi = (current_password, new_password) =>
  apiRequest('/auth/reset-password', { method: 'PATCH', body: { current_password, new_password } })

export const addPasswordApi = (new_password) =>
  apiRequest('/auth/add-password', { method: 'POST', body: { new_password } })

export const googleOAuthUrl = `${API_BASE}/auth/oauth`

// Workspace API Calls
export const getWorkspacesApi = () =>
  apiRequest('/rag/myWorkspace', { method: 'GET' })

export const createWorkspaceApi = (name) =>
  apiRequest('/rag/workspaces', { method: 'POST', body: { name } })

export const deleteWorkspaceApi = (wk_id) =>
  apiRequest(`/rag/workspace/${wk_id}`, { method: 'DELETE' })

export const inviteUserApi = (wk_id, email, role = 'member') =>
  apiRequest(`/rag/workspace/${wk_id}/invite`, { method: 'POST', body: { email, role } })
