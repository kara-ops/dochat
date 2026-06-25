import { useState, useEffect } from 'react'
import './App.css'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

type AuthToken = string | null

function App() {
  const [token, setToken] = useState<AuthToken>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const returnedToken = params.get('access_token')

    if (returnedToken) {
      setToken(returnedToken)
      localStorage.setItem('authToken', returnedToken)
      params.delete('access_token')
      params.delete('token_type')
      const cleanSearch = params.toString()
      const newUrl = `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}`
      window.history.replaceState({}, document.title, newUrl)
    } else {
      const storedToken = localStorage.getItem('authToken')
      if (storedToken) {
        setToken(storedToken)
      }
    }

    setLoading(false)
  }, [])

  const handleLogin = (authToken: string) => {
    setToken(authToken)
    localStorage.setItem('authToken', authToken)
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('authToken')
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="app">
      {!token ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <Dashboard token={token} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App
