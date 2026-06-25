import { useState } from 'react'
import { apiRequest } from '../lib/api.jsx'
import { useToast } from './ToastProvider.jsx'

const ROLE_OPTIONS = ['admin', 'member', 'viewer']

export default function MembersPanel({ workspaceId, members, refreshMembers }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const inviteMember = async (event) => {
    event.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      await apiRequest(`/rag/workspace/${workspaceId}/invite`, { method: 'POST', body: { email, role } })
      setEmail('')
      toast.notify('Invitation sent')
      refreshMembers()
    } catch (error) {
      toast.notify(error.message || 'Unable to send invite', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Members</h3>
          <p className="mt-1 text-sm text-slate-500">Invite collaborators and manage roles.</p>
        </div>
      </div>

      <form onSubmit={inviteMember} className="mt-6 grid gap-3">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="Email address"
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? 'Inviting…' : 'Invite member'}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {members.length ? (
          members.map((member) => (
            <div key={member.email} className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{member.email}</p>
                <p className="text-sm text-slate-500">{member.role}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No members added yet.</div>
        )}
      </div>
    </div>
  )
}
