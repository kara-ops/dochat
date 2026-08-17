import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Bot, Layers, UserPlus, ArrowRight, FileText } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout.jsx'
import { getWorkspacesApi, createWorkspaceApi } from '../lib/api.jsx'
import { useToast } from '../components/ToastProvider.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notify } = useToast()

  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [wkName, setWkName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    setLoading(true)
    try {
      const data = await getWorkspacesApi()
      setWorkspaces(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!wkName.trim()) return
    setCreating(true)
    try {
      const created = await createWorkspaceApi(wkName.trim())
      notify('Workspace created!', 'info')
      setWkName('')
      setShowCreateModal(false)
      if (created?.id) {
        navigate(`/workspace/${created.id}`)
      } else {
        fetchWorkspaces()
      }
    } catch (err) {
      notify(err.message || 'Failed to create workspace', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto w-full">
        {/* Hero Section */}
        <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-slate-800 shadow-2xl mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Bot className="w-48 h-48 text-blue-400" />
          </div>

          <div className="max-w-2xl relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight mb-3">
              Welcome to DocChat
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
              Organize your documents into isolated workspaces, collaborate with team members, and interact with user-owned content.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Workspace</span>
            </button>
          </div>
        </div>

        {/* Workspaces Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Your Workspaces</span>
            </h2>
            <span className="text-xs text-slate-400">{workspaces.length} Total</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              Loading workspaces...
            </div>
          ) : workspaces.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-950/40">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto mb-4 border border-slate-800">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-200 mb-1">No workspaces yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                Get started by creating your first workspace using the sidebar or the button below.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 transition"
              >
                Create Workspace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((wk) => {
                const name = wk.name || wk.workspace_name || `Workspace #${wk.id}`
                return (
                  <div
                    key={wk.id}
                    onClick={() => navigate(`/workspace/${wk.id}`)}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-blue-500/50 transition cursor-pointer group shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-medium">
                          ID: {wk.id}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-100 text-base mb-1 truncate group-hover:text-blue-400 transition">
                        {name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        Click to view workspace, invite members, and manage files.
                      </p>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition transform" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Workspace */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Create Workspace</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text"
                placeholder="Workspace name"
                value={wkName}
                onChange={(e) => setWkName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                autoFocus
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 shadow-md"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
