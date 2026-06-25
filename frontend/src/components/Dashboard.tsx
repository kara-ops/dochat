import { useState } from 'react'
import './Dashboard.css'
import DocumentUpload from './DocumentUpload'
import QueryInterface from './QueryInterface'
import WorkspaceCreate from './WorkspaceCreate'

interface DashboardProps {
  token: string
  onLogout: () => void
}

export default function Dashboard({ token, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'query' | 'upload' | 'workspace'>('query')
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<number | null>(null)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>DocChat</h1>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-btn ${activeTab === 'query' ? 'active' : ''}`}
          onClick={() => setActiveTab('query')}
        >
          Ask Questions
        </button>
        <button
          className={`nav-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          Upload Documents
        </button>
        <button
          className={`nav-btn ${activeTab === 'workspace' ? 'active' : ''}`}
          onClick={() => setActiveTab('workspace')}
        >
          Workspaces
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'query' ? (
          <QueryInterface token={token} />
        ) : activeTab === 'upload' ? (
          <DocumentUpload token={token} />
        ) : (
          <WorkspaceCreate onWorkspaceCreated={(id) => setCurrentWorkspaceId(id)} />
        )}
      </main>
    </div>
  )
}
