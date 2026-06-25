export default function DocumentUpload({ onUpload, documents, loading }) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Documents</h3>
          <p className="mt-1 text-sm text-slate-500">Upload files to enrich workspace knowledge.</p>
        </div>
        <label className="cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
          Upload
          <input
            type="file"
            onChange={(event) => onUpload(event.target.files)}
            className="hidden"
          />
        </label>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">Uploading document…</div>
      ) : null}

      <div className="space-y-3">
        {documents.length ? (
          documents.map((doc) => (
            <div key={doc.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-medium text-slate-900">{doc.filename || doc.name || 'Unknown file'}</p>
              <p className="mt-1 text-sm text-slate-500">{doc.size ? `${Math.round(doc.size / 1024)} KB` : 'Uploaded document'}</p>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No documents uploaded yet.</div>
        )}
      </div>
    </div>
  )
}
