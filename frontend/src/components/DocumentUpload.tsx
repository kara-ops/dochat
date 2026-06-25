import { useState } from 'react'
import './DocumentUpload.css'

interface DocumentUploadProps {
  token: string
}

export default function DocumentUpload({ token }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [workspaceId, setWorkspaceId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [taskId, setTaskId] = useState('')
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !workspaceId) {
      setMessage('Please select a file and workspace')
      return
    }

    setUploading(true)
    setStatus('processing')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(
        `http://localhost:8000/rag/workspaces/${workspaceId}/documents/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setTaskId(data.task_id)
      setMessage(`Upload started. Task ID: ${data.task_id}`)
      setStatus('success')

      // Poll for task status
      pollTaskStatus(data.task_id)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const pollTaskStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/rag/task/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await response.json()

        if (data.status === 'SUCCESS') {
          setMessage(`Upload completed!`)
          clearInterval(interval)
        } else if (data.status === 'FAILURE') {
          setMessage('Upload failed')
          setStatus('error')
          clearInterval(interval)
        }
      } catch (err) {
        console.error('Error checking task status:', err)
      }
    }, 2000)
  }

  return (
    <div className="upload-container">
      <div className="upload-box">
        <h2>Upload Document</h2>
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>Workspace ID</label>
            <input
              type="number"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="Enter workspace ID"
              required
            />
          </div>

          <div className="form-group">
            <label>Select PDF File</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                id="file-input"
              />
              <label htmlFor="file-input" className="file-label">
                {file ? file.name : 'Click to select file'}
              </label>
            </div>
          </div>

          <button type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>

        {message && (
          <div className={`message ${status}`}>
            {message}
          </div>
        )}

        {taskId && (
          <div className="task-info">
            <p>Task ID: <code>{taskId}</code></p>
            <p>You can check the status using this ID</p>
          </div>
        )}
      </div>
    </div>
  )
}
