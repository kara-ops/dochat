import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiRequest } from '../lib/api.jsx'
import { useToast } from '../components/ToastProvider.jsx'
import DocumentUpload from '../components/DocumentUpload.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import MembersPanel from '../components/MembersPanel.jsx'

export default function WorkspacePage() {
  const { workspaceId } = useParams()
  const [workspace, setWorkspace] = useState(null)
  const [documents, setDocuments] = useState([])
  const [members, setMembers] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const fetchWorkspace = async () => {
    setLoading(true)
    try {
      const data = await apiRequest('/rag/myWorkspace')
      const selected = data.find((item) => item.id === Number(workspaceId))
      if (!selected) {
        throw new Error('Workspace not found')
      }
      setWorkspace(selected)
      setMembers(selected.members || selected.wk_member || [])
    } catch (error) {
      toast.notify(error.message || 'Unable to load workspace', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const docs = await apiRequest('/rag/documents')
      setDocuments(docs)
    } catch (error) {
      toast.notify(error.message || 'Unable to load documents', 'error')
      setDocuments([])
    }
  }

  useEffect(() => {
    fetchWorkspace()
    fetchDocuments()
  }, [workspaceId])

  const uploadFiles = async (files) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const form = new FormData()
      Array.from(files).forEach((file) => form.append('file', file))
      await apiRequest(`/rag/workspaces/${workspaceId}/documents/upload`, {
        method: 'POST',
        body: form,
      })
      toast.notify('Document uploaded successfully')
      fetchDocuments()
    } catch (error) {
      toast.notify(error.message || 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <p className="text-slate-600">Loading workspace…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-900">{workspace?.name || 'Workspace'}</h2>
            <p className="mt-2 text-sm text-slate-500">Manage files, members, and ask questions against uploaded documents.</p>
          </div>

          <DocumentUpload onUpload={uploadFiles} documents={documents} loading={uploading} />

          <MembersPanel workspaceId={workspaceId} members={members} refreshMembers={fetchWorkspace} />
        </div>

        <div className="space-y-6">
          <ChatPanel workspaceId={workspaceId} documents={documents} />
        </div>
      </div>
    </div>
  )
}
