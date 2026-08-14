import Sidebar from '../Sidebar.jsx'

export default function AppLayout({ children, currentWorkspaceId, onSelectWorkspace }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <Sidebar
        currentWorkspaceId={currentWorkspaceId}
        onSelectWorkspace={onSelectWorkspace}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900/60 overflow-hidden relative">
        {children}
      </main>
    </div>
  )
}
