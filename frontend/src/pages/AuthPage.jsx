import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useToast } from '../components/ToastProvider.jsx'

export default function AuthPage({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp } = useAuth()
  const toast = useToast()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
      navigate('/dashboard')
    } catch (error) {
      toast.notify(error.message || 'Authentication failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const oauthUrl = '/auth/google/login'
  const modeText = mode === 'signup' ? 'Create account' : 'Welcome back'

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">DocuMind</h1>
          <p className="text-sm text-slate-500">Multi-tenant document Q&A, built for teams.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? 'Processing…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <a
            href={oauthUrl}
            className="flex items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Continue with Google
          </a>

          <div className="text-center text-sm text-slate-500">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
              className="font-semibold text-slate-900 underline-offset-4 hover:underline"
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">You will be redirected back after Google authentication.</p>
      </div>
    </div>
  )
}
