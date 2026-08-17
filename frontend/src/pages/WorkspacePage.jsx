import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Folder,
  Trash2,
  Users,
  FileText,
  Upload,
  X,
  Mail,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import AppLayout from '../components/layout/AppLayout.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import {
  getWorkspacesApi,
  deleteWorkspaceApi,
  inviteUserApi,
  getDocumentsApi,
  uploadDocumentApi,
  pollTaskApi,
} from '../lib/api.jsx'
import { useToast } from '../components/ToastProvider.jsx'

// ─── Floating Panel wrapper ───────────────────────────────────────────────────
function FloatingPanel({ onClose, title, icon: Icon, children, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className={`absolute top-14 right-0 z-40 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-6rem)] ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Icon className="w-4 h-4 text-blue-400" />
          {title}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
        {children}
      </div>
    </div>
  )
}

// ─── Documents Panel ──────────────────────────────────────────────────────────
function DocumentsPanel({ workspaceId, onClose }) {
  const [docs, setDocs] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null) // { message, type: 'success'|'error'|'info' }
  const fileRef = useRef(null)
  const pollRef = useRef(null)
  const { notify } = useToast()

  const fetchDocs = useCallback(async () => {
    try {
      const data = await getDocumentsApi()
      setDocs(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch docs', err)
    } finally {
      setLoadingDocs(false)
    }
  }, [])

  useEffect(() => {
    fetchDocs()
    return () => clearInterval(pollRef.current)
  }, [fetchDocs])

  const pollTask = useCallback((task_id) => {
    setUploadStatus({ message: 'Processing document…', type: 'info' })
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      try {
        const result = await pollTaskApi(task_id)
        const status = result?.status?.toUpperCase()
        if (status === 'SUCCESS') {
          clearInterval(pollRef.current)
          setUploadStatus({ message: 'Document ingested successfully!', type: 'success' })
          setUploading(false)
          fetchDocs()
        } else if (status === 'FAILURE' || status === 'REVOKED') {
          clearInterval(pollRef.current)
          setUploadStatus({ message: 'Ingestion failed. Please try again.', type: 'error' })
          setUploading(false)
        } else if (attempts > 60) {
          clearInterval(pollRef.current)
          setUploadStatus({ message: 'Timed out waiting for ingestion.', type: 'error' })
          setUploading(false)
        }
      } catch {
        clearInterval(pollRef.current)
        setUploading(false)
      }
    }, 3000)
  }, [fetchDocs])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadStatus({ message: `Uploading ${file.name}…`, type: 'info' })
    try {
      const result = await uploadDocumentApi(workspaceId, file)
      if (result?.task_id) {
        pollTask(result.task_id)
      } else {
        setUploadStatus({ message: 'Upload complete.', type: 'success' })
        setUploading(false)
        fetchDocs()
      }
    } catch (err) {
      setUploadStatus({ message: err.message || 'Upload failed', type: 'error' })
      setUploading(false)
    }
    e.target.value = ''
  }

  const statusColor = {
    success: 'text-emerald-400',
    error: 'text-rose-400',
    info: 'text-blue-400',
  }

  return (
    <FloatingPanel onClose={onClose} title="Documents" icon={FileText}>
      {/* Upload zone */}
      <div className="p-4 border-b border-slate-800/60">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => !uploading && fileRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-500/60 bg-slate-950/40 hover:bg-blue-500/5 text-slate-400 hover:text-blue-400 text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 group-hover:scale-110 transition" />
          )}
          {uploading ? 'Uploading…' : 'Upload PDF / TXT / DOCX'}
        </button>

        {uploadStatus && (
          <div className={`mt-2 flex items-center gap-1.5 text-[11px] font-medium ${statusColor[uploadStatus.type]}`}>
            {uploadStatus.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {uploadStatus.type === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
            {uploadStatus.type === 'info' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {uploadStatus.message}
          </div>
        )}
      </div>

      {/* Document list */}
      <div className="p-2 space-y-1">
        {loadingDocs ? (
          <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading…
          </div>
        ) : docs.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No documents yet. Upload one above.
          </div>
        ) : (
          docs.map((doc, i) => (
            <div
              key={doc.id || doc.doc_id || i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 transition group"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {doc.filename || doc.name || `Document #${doc.id || i + 1}`}
                </p>
                <p className="text-[10px] text-slate-500">ID: {doc.id || doc.doc_id || '—'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </FloatingPanel>
  )
}

// ─── Members Panel ────────────────────────────────────────────────────────────
function MembersPanel({ workspaceId, onClose }) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const { notify } = useToast()

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await inviteUserApi(workspaceId, inviteEmail.trim(), inviteRole)
      notify(`Invited ${inviteEmail} as ${inviteRole}`, 'info')
      setInviteEmail('')
    } catch (err) {
      notify(err.message || 'Failed to invite user', 'error')
    } finally {
      setInviting(false)
    }
  }

  return (
    <FloatingPanel onClose={onClose} title="Members" icon={Users}>
      <div className="p-4">
        <p className="text-xs text-slate-400 mb-4">
          Invite a collaborator to this workspace by email.
        </p>
        <form onSubmit={handleInvite} className="space-y-3">
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              required
            />
          </div>

          <div className="relative">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition pr-8"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
          </div>

          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition shadow-lg shadow-blue-600/20"
          >
            {inviting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserPlus className="w-3.5 h-3.5" />
            )}
            {inviting ? 'Sending invite…' : 'Send Invite'}
          </button>
        </form>
      </div>
    </FloatingPanel>
  )
}

// ─── Main WorkspacePage ───────────────────────────────────────────────────────
export default function WorkspacePage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()

  const [workspace, setWorkspace] = useState(null)
  const [loadingWk, setLoadingWk] = useState(true)

  const [activePanel, setActivePanel] = useState(null) // 'docs' | 'members' | null

  useEffect(() => {
    fetchWorkspace()
  }, [workspaceId])

  const fetchWorkspace = async () => {
    setLoadingWk(true)
    try {
      const data = await getWorkspacesApi()
      const list = Array.isArray(data) ? data : []
      const found = list.find((w) => String(w.id) === String(workspaceId))
      setWorkspace(found || { id: workspaceId, name: `Workspace #${workspaceId}` })
    } catch {
      setWorkspace({ id: workspaceId, name: `Workspace #${workspaceId}` })
    } finally {
      setLoadingWk(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this workspace? This cannot be undone.')) return
    try {
      await deleteWorkspaceApi(workspaceId)
      notify('Workspace deleted', 'info')
      navigate('/dashboard')
    } catch (err) {
      notify(err.message || 'Failed to delete workspace', 'error')
    }
  }

  const togglePanel = (panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel))
  }

  const wkName = workspace?.name || workspace?.workspace_name || `Workspace #${workspaceId}`

  return (
    <AppLayout currentWorkspaceId={workspaceId}>
      <div className="h-full flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 px-5 py-3 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-center justify-between gap-4">
          {/* Left: workspace name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0">
              <Folder className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              {loadingWk ? (
                <div className="h-4 w-36 rounded bg-slate-800 animate-pulse" />
              ) : (
                <h2 className="text-sm font-bold text-slate-100 truncate">{wkName}</h2>
              )}
              <p className="text-[10px] text-slate-500 mt-0.5">#{workspaceId}</p>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 relative">
            {/* Documents panel toggle */}
            <button
              onClick={() => togglePanel('docs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                activePanel === 'docs'
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Docs
            </button>

            {/* Members panel toggle */}
            <button
              onClick={() => togglePanel('members')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                activePanel === 'members'
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Members
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              title="Delete workspace"
              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Floating panels (positioned relative to header right edge) */}
            {activePanel === 'docs' && (
              <DocumentsPanel
                workspaceId={workspaceId}
                onClose={() => setActivePanel(null)}
              />
            )}
            {activePanel === 'members' && (
              <MembersPanel
                workspaceId={workspaceId}
                onClose={() => setActivePanel(null)}
              />
            )}
          </div>
        </header>

        {/* Chat area — takes all remaining space */}
        <div className="flex-1 overflow-hidden">
          <ChatPanel workspaceId={workspaceId} />
        </div>
      </div>
    </AppLayout>
  )
}
