import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../lib/api.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useToast } from '../components/ToastProvider.jsx'
import WorkspaceSidebar from '../components/WorkspaceSidebar.jsx'

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { clearAuth } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const fetchWorkspaces = async () => {
    setLoading(true)
    try {
      const data = await apiRequest('/rag/myWorkspace')
      setWorkspaces(data)
    } catch (error) {
      toast.notify(error.message || 'Unable to fetch workspaces', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const createWorkspace = async () => {
    const workspaceName = prompt('Workspace name')
    if (!workspaceName) return
    setCreating(true)
    try {
      const data = await apiRequest('/rag/workspaces', { method: 'POST', body: { name: workspaceName } })
      setWorkspaces((current) => [data, ...current])
      toast.notify('Workspace created successfully')
    } catch (error) {
      toast.notify(error.message || 'Unable to create workspace', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[320px_1fr]">
      <aside className="border-r border-slate-200 bg-slate-950 text-white">
        <div className="flex h-full flex-col justify-between p-6">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">DocuMind</p>
              <h1 className="mt-3 text-2xl font-semibold">Workspace hub</h1>
              <p className="mt-2 text-sm text-slate-400">Manage your tenant spaces and get started with document chat.</p>
            </div>
            <button
              onClick={createWorkspace}
              className="w-full rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              {creating ? 'Creating…' : 'New workspace'}
            </button>
            <WorkspaceSidebar workspaces={workspaces} loading={loading} />
          </div>
          <div className="space-y-3">
            <button
              onClick={() => {
                clearAuth()
                navigate('/login')
              }}
              className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Welcome to DocuMind</h2>
            <p className="text-slate-600">Select a workspace from the sidebar to manage documents, members, and ask questions using RAG chat.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
