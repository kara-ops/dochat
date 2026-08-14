import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Plus,
  FolderPlus,
  Folder,
  Trash2,
  LogOut,
  Monitor,
  Key,
  Lock,
  ChevronUp,
  User as UserIcon,
  Sparkles,
  Bot,
  Layers,
  X,
  Search,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getWorkspacesApi, createWorkspaceApi, deleteWorkspaceApi } from '../lib/api.jsx'
import { useToast } from './ToastProvider.jsx'
import ProfileModal from './ProfileModal.jsx'

export default function Sidebar({ currentWorkspaceId, onSelectWorkspace }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { notify } = useToast()

  const [workspaces, setWorkspaces] = useState([])
  const [loadingWk, setLoadingWk] = useState(true)

  // Modals & Menu States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWkName, setNewWkName] = useState('')
  const [creating, setCreating] = useState(false)

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [profileModalTab, setProfileModalTab] = useState(null) // 'sessions' | 'add_password' | 'reset_password'

  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    setLoadingWk(true)
    try {
      const data = await getWorkspacesApi()
      setWorkspaces(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch workspaces', err)
    } finally {
      setLoadingWk(false)
    }
  }

  const handleCreateWorkspace = async (e) => {
    e.preventDefault()
    if (!newWkName.trim()) return
    setCreating(true)
    try {
      const newWk = await createWorkspaceApi(newWkName.trim())
      notify('Workspace created!', 'info')
      setNewWkName('')
      setShowCreateModal(false)
      fetchWorkspaces()
      if (newWk?.id) {
        navigate(`/workspace/${newWk.id}`)
      }
    } catch (err) {
      notify(err.message || 'Failed to create workspace', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteWorkspace = async (e, wkId) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this workspace?')) return
    try {
      await deleteWorkspaceApi(wkId)
      notify('Workspace deleted', 'info')
      fetchWorkspaces()
      if (currentWorkspaceId === String(wkId)) {
        navigate('/dashboard')
      }
    } catch (err) {
      notify(err.message || 'Failed to delete workspace', 'error')
    }
  }

  const filteredWorkspaces = workspaces.filter((w) =>
    (w.name || w.workspace_name || `Workspace #${w.id}`)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <aside className="w-64 md:w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col h-screen text-slate-300 relative select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-900 flex items-center justify-between">
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition transform">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                DocChat <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Workspace Hub
              </p>
            </div>
          </div>
        </div>

        {/* Action: Create Workspace Button */}
        <div className="p-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-100 font-medium text-sm transition group shadow-sm"
          >
            <Plus className="w-4 h-4 text-blue-400 group-hover:rotate-90 transition transform duration-200" />
            <span>Create Workspace</span>
          </button>
        </div>

        {/* Search */}
        {workspaces.length > 3 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-700"
              />
            </div>
          </div>
        )}

        {/* Workspaces Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Workspaces</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
              {workspaces.length}
            </span>
          </div>

          {loadingWk ? (
            <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              Loading workspaces...
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-800/80 rounded-xl my-2">
              No workspaces found.
            </div>
          ) : (
            filteredWorkspaces.map((wk) => {
              const isActive = String(wk.id) === String(currentWorkspaceId)
              const wkName = wk.name || wk.workspace_name || `Workspace #${wk.id}`

              return (
                <div
                  key={wk.id}
                  onClick={() => {
                    if (onSelectWorkspace) onSelectWorkspace(wk.id)
                    navigate(`/workspace/${wk.id}`)
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition ${
                    isActive
                      ? 'bg-blue-600/10 border border-blue-500/30 text-blue-300'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <Layers
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate">{wkName}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteWorkspace(e, wk.id)}
                    title="Delete Workspace"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Profile Footer Section */}
        <div className="p-3 border-t border-slate-900 relative">
          {/* Profile Dropdown Popup Menu */}
          {showProfileMenu && (
            <div className="absolute bottom-16 left-3 right-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-30 animate-fade-in p-1.5 space-y-1">
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.email || 'User Account'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">Authenticated Session</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  setProfileModalTab('sessions')
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition"
              >
                <Monitor className="w-4 h-4 text-blue-400" />
                Active Sessions
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  setProfileModalTab('add_password')
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition"
              >
                <Key className="w-4 h-4 text-emerald-400" />
                Add Password
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  setProfileModalTab('reset_password')
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                Reset Password
              </button>

              <div className="border-t border-slate-800/80 my-1 pt-1">
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Profile Trigger Button */}
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow">
                {user?.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.email || 'User Account'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">Manage account</p>
              </div>
            </div>
            <ChevronUp
              className={`w-4 h-4 text-slate-400 transition transform ${
                showProfileMenu ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </aside>

      {/* Modal: Create Workspace */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Create New Workspace</h3>
                <p className="text-xs text-slate-400">Set up a workspace to store documents.</p>
              </div>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Research & Engineering"
                  value={newWkName}
                  onChange={(e) => setNewWkName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Settings / Profile Modal */}
      <ProfileModal
        isOpen={Boolean(profileModalTab)}
        onClose={() => setProfileModalTab(null)}
        activeTab={profileModalTab || 'sessions'}
      />
    </>
  )
}
