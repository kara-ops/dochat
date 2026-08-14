import { useState, useEffect } from 'react'
import { Monitor, Key, Lock, X, Shield, Clock, Smartphone, Globe, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useToast } from './ToastProvider.jsx'

export default function ProfileModal({ isOpen, onClose, activeTab = 'sessions' }) {
  const [tab, setTab] = useState(activeTab)
  const { getSessions, addPassword, resetPassword } = useAuth()
  const { notify } = useToast()

  // State for sessions
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [sessionsError, setSessionsError] = useState(null)

  // State for add password
  const [addPassValue, setAddPassValue] = useState('')
  const [loadingAddPass, setLoadingAddPass] = useState(false)

  // State for reset password
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [loadingResetPass, setLoadingResetPass] = useState(false)

  useEffect(() => {
    setTab(activeTab)
  }, [activeTab])

  useEffect(() => {
    if (isOpen && tab === 'sessions') {
      fetchSessions()
    }
  }, [isOpen, tab])

  const fetchSessions = async () => {
    setLoadingSessions(true)
    setSessionsError(null)
    try {
      const data = await getSessions()
      setSessions(Array.isArray(data) ? data : [data])
    } catch (err) {
      setSessionsError(err.message || 'Failed to load session info')
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleAddPassword = async (e) => {
    e.preventDefault()
    if (!addPassValue || addPassValue.length < 6) {
      notify('Password must be at least 6 characters', 'error')
      return
    }
    setLoadingAddPass(true)
    try {
      await addPassword(addPassValue)
      notify('Password added successfully!', 'info')
      setAddPassValue('')
      onClose()
    } catch (err) {
      notify(err.message || 'Failed to add password', 'error')
    } finally {
      setLoadingAddPass(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!currentPass || !newPass) {
      notify('Please fill out all fields', 'error')
      return
    }
    setLoadingResetPass(true)
    try {
      await resetPassword(currentPass, newPass)
      notify('Password changed successfully!', 'info')
      setCurrentPass('')
      setNewPass('')
      onClose()
    } catch (err) {
      notify(err.message || 'Failed to reset password', 'error')
    } finally {
      setLoadingResetPass(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">Account & Security</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/30 px-6 gap-2 pt-2">
          <button
            onClick={() => setTab('sessions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              tab === 'sessions'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Active Sessions
          </button>
          <button
            onClick={() => setTab('add_password')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              tab === 'add_password'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            Add Password
          </button>
          <button
            onClick={() => setTab('reset_password')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              tab === 'reset_password'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            Reset Password
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  Locations and devices where you are currently signed in.
                </p>
                <button
                  onClick={fetchSessions}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  Refresh list
                </button>
              </div>

              {loadingSessions ? (
                <div className="py-8 flex items-center justify-center text-slate-400 gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  Fetching sessions...
                </div>
              ) : sessionsError ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{sessionsError}</span>
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">No active sessions found.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((sess, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-4 hover:border-slate-700/80 transition"
                    >
                      <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300">
                        {sess.device_type === 'mobile' ? (
                          <Smartphone className="w-5 h-5" />
                        ) : (
                          <Monitor className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-200">
                            {sess.device_name || sess.browser || 'Unknown Device'}
                          </h4>
                          {idx === 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                              Current Device
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          {sess.ip_address && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3.5 h-3.5" />
                              {sess.ip_address}
                            </span>
                          )}
                          {sess.last_seen && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Last seen: {new Date(sess.last_seen).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'add_password' && (
            <form onSubmit={handleAddPassword} className="space-y-4">
              <p className="text-sm text-slate-400">
                If you originally signed up with Google OAuth, you can set a password here to allow signing in directly with email & password.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={addPassValue}
                  onChange={(e) => setAddPassValue(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loadingAddPass}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingAddPass ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Set Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {tab === 'reset_password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-slate-400">
                Change your existing account password.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loadingResetPass}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingResetPass ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
