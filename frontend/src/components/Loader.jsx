export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-5 text-slate-600 shadow-soft">
      <div className="h-4 w-4 animate-pulse rounded-full bg-slate-500" />
      <span>{label}</span>
    </div>
  )
}
