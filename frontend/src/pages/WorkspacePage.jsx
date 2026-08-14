import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  UserPlus,
  Trash2,
  AlertTriangle,
  Upload,
  Send,
  Users,
  Folder,
  ShieldAlert,
  X,
  CheckCircle2,
  Mail,
  Shield,
  Bot,
} from 'lucide-react'
import AppLayout from '../components/layout/AppLayout.jsx'
import { inviteUserApi, deleteWorkspaceApi, getWorkspacesApi } from '../lib/api.jsx'
import { useToast } from '../components/ToastProvider.jsx'

export default function WorkspacePage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()

  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)

  // Chat message input mock (since RAG is down)
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    fetchWorkspaceDetails()
  }, [workspaceId])

  const fetchWorkspaceDetails = async () => {
    setLoading(true)
    try {
      const data = await getWorkspacesApi()
      const list = Array.isArray(data) ? data : []
      const found = list.find((w) => String(w.id) === String(workspaceId))
      if (found) {
        setWorkspace(found)
      } else {
        setWorkspace({ id: workspaceId, name: `Workspace #${workspaceId}` })
      }
    } catch (err) {
      console.error(err)
      setWorkspace({ id: workspaceId, name: `Workspace #${workspaceId}` })
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail) return
    setInviting(true)
    try {
      await inviteUserApi(workspaceId, inviteEmail, inviteRole)
      notify(`Invited ${inviteEmail} as ${inviteRole}!`, 'info')
      setInviteEmail('')
      setShowInviteModal(false)
    } catch (err) {
      notify(err.message || 'Failed to invite user', 'error')
    } finally {
      setInviting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this workspace?')) return
    try {
      await deleteWorkspaceApi(workspaceId)
      notify('Workspace deleted', 'info')
      navigate('/dashboard')
    } catch (err) {
      notify(err.message || 'Failed to delete workspace', 'error')
    }
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    notify('RAG engine is currently down. Querying is paused.', 'error')
    setChatInput('')
  }

  const wkName = workspace?.name || workspace?.workspace_name || `Workspace #${workspaceId}`

  return (
    <AppLayout currentWorkspaceId={workspaceId}>
      <div className="h-full flex flex-col min-w-0">
        {/* Workspace Top Header Bar */}
        <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Folder className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-100 truncate">{wkName}</h2>
              <p className="text-xs text-slate-400">Workspace ID: #{workspaceId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium border border-slate-700 transition"
            >
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span>Invite Member</span>
            </button>
            <button
              onClick={handleDelete}
              title="Delete Workspace"
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Workspace Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* RAG Offline Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-start gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">RAG Retrieval Service Offline</h4>
              <p className="text-xs text-amber-200/80 mt-0.5">
                The RAG ingestion and question-answering pipeline is currently undergoing scheduled maintenance. Workspace permissions, member invites, and token authentication remain fully operational.
              </p>
            </div>
          </div>

          {/* Quick Actions & Workspace Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Box (Disabled style for RAG) */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-400" />
                    Document Ingestion
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Paused
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Upload PDF or text documents to train the RAG context store for this workspace.
                </p>
              </div>

              <div className="p-6 border-2 border-dashed border-slate-800 rounded-xl text-center bg-slate-900/30">
                <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-400">
                  File upload queue disabled during maintenance
                </p>
              </div>
            </div>

            {/* Workspace Members & Access Box */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Team Access
                  </h3>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    + Invite
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Invite collaborators to share workspace documents and search results.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Workspace Owner</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    Owner
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RAG Chat Box Mock */}
          <div className="rounded-2xl bg-slate-950/70 border border-slate-800/80 p-6 flex flex-col h-80 justify-between">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <Bot className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-slate-200 text-sm">Ask Workspace Documents</h3>
            </div>

            <div className="flex-1 flex items-center justify-center text-center p-4">
              <p className="text-xs text-slate-400 max-w-sm">
                RAG Q&A query engine is offline. Start typing once the service resumes.
              </p>
            </div>

            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                placeholder="Ask a question about uploaded documents..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Invite Collaborator</h3>
                <p className="text-xs text-slate-400">Add a user to this workspace.</p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  User Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
