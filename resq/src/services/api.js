const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

const TOKEN_STORAGE_KEY = 'resq_token'
const USER_STORAGE_KEY = 'resq_user'

const buildUrl = (path) => {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

const parseErrorMessage = (payload, fallback) => {
  if (!payload) {
    return fallback
  }

  if (typeof payload === 'string') {
    return payload
  }

  if (typeof payload.detail === 'string') {
    return payload.detail
  }

  const firstValue = Object.values(payload)[0]

  if (Array.isArray(firstValue) && firstValue.length > 0) {
    return String(firstValue[0])
  }

  if (typeof firstValue === 'string') {
    return firstValue
  }

  return fallback
}

const request = async (path, options = {}) => {
  const {
    method = 'GET',
    body,
    token,
    headers = {},
    signal,
  } = options

  const authToken = token || getAuthToken()
  const resolvedHeaders = { ...headers }

  if (body !== undefined) {
    resolvedHeaders['Content-Type'] = 'application/json'
  }

  if (authToken) {
    resolvedHeaders.Authorization = `Token ${authToken}`
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: resolvedHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  const contentType = response.headers.get('content-type') || ''
  let payload = null

  if (contentType.includes('application/json')) {
    payload = await response.json()
  } else {
    const text = await response.text()
    payload = text ? { detail: text } : null
  }

  if (!response.ok) {
    const message = parseErrorMessage(payload, 'Request failed.')
    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

export const getAuthToken = () => window.localStorage.getItem(TOKEN_STORAGE_KEY)

export const getStoredUser = () => {
  const rawUser = window.localStorage.getItem(USER_STORAGE_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

export const setAuthSession = ({ token, user }) => {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export const clearAuthSession = () => {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(USER_STORAGE_KEY)
}

export const loginUser = async ({ email, password }) => request('/auth/login/', {
  method: 'POST',
  body: { email, password },
})

export const fetchProfile = async () => request('/auth/profile/')

export const fetchOverview = async () => request('/system/overview/')

export const fetchCameras = async () => request('/cameras/')

export const createCamera = async (payload) => request('/cameras/', {
  method: 'POST',
  body: payload,
})

export const updateCamera = async (id, payload) => request(`/cameras/${id}/`, {
  method: 'PATCH',
  body: payload,
})

export const deleteCamera = async (id) => request(`/cameras/${id}/`, {
  method: 'DELETE',
})

export const fetchIncidents = async () => request('/incidents/')

export const createIncident = async (payload) => request('/incidents/', {
  method: 'POST',
  body: payload,
})

export const updateIncident = async (id, payload) => request(`/incidents/${id}/`, {
  method: 'PATCH',
  body: payload,
})

export const deleteIncident = async (id) => request(`/incidents/${id}/`, {
  method: 'DELETE',
})
