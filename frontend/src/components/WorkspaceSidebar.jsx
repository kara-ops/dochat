import { Link } from 'react-router-dom'

export default function WorkspaceSidebar({ workspaces, selectedId, onCreate, loading }) {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Workspaces</p>
          <h2 className="text-xl font-semibold text-slate-900">Your spaces</h2>
        </div>
        <button
          onClick={onCreate}
          className="rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          New
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">Loading workspaces…</div>
        ) : workspaces.length ? (
          workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              to={`/workspace/${workspace.id}`}
              className={`block rounded-2xl border px-4 py-4 transition ${workspace.id === selectedId ? 'border-slate-900 bg-slate-900 text-white' : 'border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white'}`}
            >
              <p className="font-semibold">{workspace.name}</p>
              <p className="mt-1 text-sm text-slate-500">{workspace.members?.length ?? 0} members</p>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No workspaces yet. Create one to get started.</div>
        )}
      </div>
    </div>
  )
}
