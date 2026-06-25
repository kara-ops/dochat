import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../lib/api.jsx'
import { useToast } from './ToastProvider.jsx'

export default function ChatPanel({ workspaceId, documents }) {
  const [question, setQuestion] = useState('')
  const [selectedDocument, setSelectedDocument] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const toast = useToast()
  const controllerRef = useRef(null)

  useEffect(() => {
    if (!selectedDocument && documents?.length) {
      setSelectedDocument(documents[0].doc_id)
    }
    return () => {
      controllerRef.current?.abort()
    }
  }, [documents, selectedDocument])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!question.trim()) return
    if (!selectedDocument) {
      toast.notify('Select a document before asking a question', 'error')
      return
    }
    setAnswer('')
    setSources([])
    setLoading(true)
    setIsStreaming(true)

    try {
      controllerRef.current = new AbortController()
      const response = await fetch('/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('documind_tokens') || '{}').access_token}`,
        },
        body: JSON.stringify({ question, document_id: selectedDocument }),
        signal: controllerRef.current.signal,
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(errorBody || 'Chat request failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let partialAnswer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.trim()) continue
          if (line === '[DONE]') {
            break
          }
          try {
            const event = JSON.parse(line)
            if (event.token) {
              partialAnswer += event.token
              setAnswer(partialAnswer)
            }
            if (event.final) {
              setSources(event.final.sources || [])
              setMessages((current) => [...current, { question, answer: event.final.answer, sources: event.final.sources || [] }])
            }
          } catch {
            partialAnswer += line
            setAnswer(partialAnswer)
          }
        }
      }
    } catch (error) {
      toast.notify(error.message || 'Unable to stream chat response', 'error')
    } finally {
      setLoading(false)
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Chat</h3>
        <p className="mt-1 text-sm text-slate-500">Ask questions about your workspace documents.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <select
            value={selectedDocument}
            onChange={(event) => setSelectedDocument(Number(event.target.value))}
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
          >
            <option value="">Select a document</option>
            {documents.map((doc) => (
              <option key={doc.doc_id} value={doc.doc_id}>
                {doc.filename || `Document ${doc.doc_id}`}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading || !selectedDocument}
            className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Thinking…' : 'Send'}
          </button>
        </div>
        <textarea
          rows="3"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask something about your documents..."
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-500">Streaming answer tokens as they arrive.</span>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Thinking…' : 'Send'}
          </button>
        </div>
      </form>

      <div className="overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-900">
        <div className="min-h-[160px] whitespace-pre-wrap text-sm leading-7">{answer || 'Responses appear here as they stream.'}</div>
        {sources.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <span key={`${source.filename}-${index}`} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                Source: {source.filename} (chunk {source.chunk_index})
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {messages.length ? (
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Q: {message.question}</p>
              <p className="mt-2 text-sm leading-7 text-slate-900">{message.answer}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {message.sources.map((source, idx) => (
                  <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    Source: {source.filename} (chunk {source.chunk_index})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
