import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  setAccessToken,
  loginApi,
  signUpApi,
  logoutApi,
  refreshTokenApi,
  getSessionsApi,
  resetPasswordApi,
  addPasswordApi,
} from '../lib/api.jsx'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessTokenState, setAccessTokenState] = useState(null)
  const [loading, setLoading] = useState(true)

  const handleSetAccessToken = useCallback((token, userDetails = null) => {
    setAccessToken(token)
    setAccessTokenState(token)
    if (token) {
      if (userDetails) {
        setUser(userDetails)
      } else {
        setUser((prev) => prev || { authenticated: true })
      }
    } else {
      setUser(null)
    }
  }, [])

  // On initial app load, try refreshing token with a 3s safety timeout
  useEffect(() => {
    let isMounted = true

    async function initAuth() {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 3000)
      )

      try {
        const res = await Promise.race([refreshTokenApi(), timeoutPromise])
        const token = res.access_token || res.access
        if (isMounted && token) {
          handleSetAccessToken(token, res.user)
        }
      } catch (err) {
        if (isMounted) {
          handleSetAccessToken(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [handleSetAccessToken])

  const signIn = async (email, password) => {
    const res = await loginApi(email, password)
    const token = res.access_token
    handleSetAccessToken(token, { email, ...res.user })
    return res
  }

  const signUp = async (email, password) => {
    const res = await signUpApi(email, password)
    const token = res.access_token
    handleSetAccessToken(token, { email, ...res.user })
    return res
  }

  const signOut = async () => {
    try {
      await logoutApi()
    } catch (e) {
      console.warn('Logout network call failed, clearing local state anyway', e)
    } finally {
      handleSetAccessToken(null)
    }
  }

  const getSessions = async () => {
    return await getSessionsApi()
  }

  const resetPassword = async (currentPassword, newPassword) => {
    return await resetPasswordApi(currentPassword, newPassword)
  }

  const addPassword = async (newPassword) => {
    return await addPasswordApi(newPassword)
  }

  const value = {
    user,
    accessToken: accessTokenState,
    loading,
    isAuthenticated: Boolean(accessTokenState),
    signIn,
    signUp,
    signOut,
    getSessions,
    resetPassword,
    addPassword,
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
