export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md px-5 py-4 text-slate-300 shadow-xl">
      <div className="relative flex h-5 w-5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-500"></span>
      </div>
      <span className="text-sm font-medium tracking-wide">{label}</span>
    </div>
  )
}
