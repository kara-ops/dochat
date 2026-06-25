import { createContext, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api.jsx'

const AuthContext = createContext(null)

const AUTH_TOKENS_KEY = 'documind_tokens'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_TOKENS_KEY)
    if (stored) {
      try {
        const tokens = JSON.parse(stored)
        setUser({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token })
      } catch (error) {
        localStorage.removeItem(AUTH_TOKENS_KEY)
      }
    }
    setLoading(false)
  }, [])

  const saveTokens = (tokens) => {
    localStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify(tokens))
    setUser({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token })
  }

  const clearAuth = () => {
    localStorage.removeItem(AUTH_TOKENS_KEY)
    setUser(null)
  }

  const signIn = async (email, password) => {
    const data = await apiRequest('/auth/sign_in', { method: 'POST', body: { email, password } })
    saveTokens(data)
    return data
  }

  const signUp = async (email, password) => {
    const data = await apiRequest('/auth/sign_up', { method: 'POST', body: { email, password } })
    saveTokens(data)
    return data
  }

  const refreshToken = async () => {
    const stored = localStorage.getItem(AUTH_TOKENS_KEY)
    if (!stored) throw new Error('No refresh token')
    const tokens = JSON.parse(stored)
    const data = await apiRequest('/auth/refresh', { method: 'POST', body: { refresh_token: tokens.refresh_token }, skipAuth: true })
    saveTokens({ ...tokens, ...data })
    return data
  }

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user?.accessToken),
    signIn,
    signUp,
    refreshToken,
    clearAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
