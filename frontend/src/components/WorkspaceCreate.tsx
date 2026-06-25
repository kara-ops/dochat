import { useState, useEffect } from 'react'
import { createWorkspace, getMyWorkspaces } from '../api/workspace'

interface WorkspaceCreateProps {
  onWorkspaceCreated: (id: number) => void
}

export default function WorkspaceCreate({ onWorkspaceCreated }: WorkspaceCreateProps) {
  const [name, setName] = useState('')
  const [workspaces, setWorkspaces] = useState<Array<{ id: number; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const response = await getMyWorkspaces()
        setWorkspaces(response)
      } catch (err) {
        console.error('Unable to load workspaces', err)
      }
    }

    loadWorkspaces()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setMessage('Workspace name is required')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const workspace = await createWorkspace(name.trim())
      setWorkspaces((prev) => [...prev, workspace])
      setName('')
      setMessage(`Workspace created: ${workspace.name}`)
      onWorkspaceCreated(workspace.id)
    } catch (err) {
      setMessage('Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="workspace-create-box">
      <h2>Create Workspace</h2>
      <form onSubmit={handleCreate}>
        <div className="form-group">
          <label>Workspace Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter workspace name"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Workspace'}
        </button>
      </form>

      {message && <div className="message">{message}</div>}

      {workspaces.length > 0 && (
        <div className="workspace-list">
          <h3>Your Workspaces</h3>
          <ul>
            {workspaces.map((workspace) => (
              <li key={workspace.id}>{workspace.name} (ID: {workspace.id})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
