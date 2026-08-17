import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, Bot, User, AlertCircle, FileSearch, ChevronDown, ChevronRight, Brain } from 'lucide-react'
import { queryRagStream } from '../lib/api.jsx'
import { useToast } from './ToastProvider.jsx'

// ─── Stream parser ─────────────────────────────────────────────────────────────
// Incrementally splits a growing raw string into { thinking, answer, state }
// state: 'thinking' | 'answering' | 'done'
function parseStream(raw) {
  const thinkOpen = raw.indexOf('<think>')
  const thinkClose = raw.indexOf('</think>')

  if (thinkOpen === -1) {
    // No thinking block at all — pure answer
    return { thinking: '', answer: raw, phase: 'answering' }
  }

  const thinkContent = thinkClose === -1
    ? raw.slice(thinkOpen + 7)                       // still inside <think>
    : raw.slice(thinkOpen + 7, thinkClose)

  const answerContent = thinkClose === -1
    ? ''
    : raw.slice(thinkClose + 8).trimStart()          // everything after </think>

  const phase = thinkClose === -1 ? 'thinking' : 'answering'

  return { thinking: thinkContent, answer: answerContent, phase }
}

// ─── Thinking block component ──────────────────────────────────────────────────
function ThinkingBlock({ content, phase, forceOpen }) {
  // Auto-collapse when answer starts; user can re-open
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (phase === 'answering') {
      setIsOpen(false)
    }
  }, [phase])

  // While still thinking, keep open
  const effectivelyOpen = forceOpen || isOpen

  return (
    <div className="mb-3 rounded-xl overflow-hidden border border-slate-700/40 bg-slate-900/60">
      {/* Header */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-800/40 transition group"
      >
        <Brain className={`w-3.5 h-3.5 flex-shrink-0 ${phase === 'thinking' ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
        <span className={`text-xs font-medium flex-1 ${phase === 'thinking' ? 'text-indigo-300' : 'text-slate-400'}`}>
          {phase === 'thinking' ? 'Thinking…' : 'Thought'}
        </span>
        {phase === 'thinking' ? (
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" />
          </span>
        ) : effectivelyOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition" />
        )}
      </button>

      {/* Collapsible content */}
      {effectivelyOpen && content && (
        <div className="px-3 pb-3 pt-0">
          <div className="max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-1">
            <p className="text-[11.5px] leading-relaxed text-slate-500 whitespace-pre-wrap font-mono">
              {content}
              {phase === 'thinking' && (
                <span className="inline-block w-0.5 h-3.5 bg-indigo-500 ml-0.5 animate-pulse align-text-bottom" />
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Single message bubble ─────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex gap-3 items-start justify-end">
        <div className="max-w-[78%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-blue-600 text-white shadow-sm">
          {msg.content}
        </div>
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shadow">
          <User className="w-3.5 h-3.5 text-slate-300" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 items-start justify-start">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow mt-0.5">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="max-w-[78%] space-y-0">
        {/* Thinking block — shown if there was any thinking content */}
        {msg.thinking && (
          <ThinkingBlock content={msg.thinking} phase="answering" />
        )}
        {/* Answer */}
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
            msg.error
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2'
              : 'bg-slate-800/80 border border-slate-700/60 text-slate-200'
          }`}
        >
          {msg.error && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />}
          {msg.content}
        </div>
      </div>
    </div>
  )
}

// ─── Streaming bot bubble (live) ───────────────────────────────────────────────
function StreamingBubble({ rawAccumulated }) {
  const { thinking, answer, phase } = parseStream(rawAccumulated)

  return (
    <div className="flex gap-3 items-start justify-start">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow mt-0.5">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="max-w-[78%] space-y-0">
        {/* Thinking block — shown while thinking OR if thinking exists after answer started */}
        {(phase === 'thinking' || thinking) && (
          <ThinkingBlock content={thinking} phase={phase} forceOpen={phase === 'thinking'} />
        )}

        {/* Answer area */}
        {phase === 'answering' && (
          <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-slate-800/80 border border-slate-700/60 text-slate-200 shadow-sm">
            {answer || (
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
              </span>
            )}
            {answer && (
              <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse align-text-bottom" />
            )}
          </div>
        )}

        {/* Pure thinking, no answer yet — show a waiting indicator below the think block */}
        {phase === 'thinking' && !answer && (
          <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-slate-800/80 border border-slate-700/60 shadow-sm">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ChatPanel ────────────────────────────────────────────────────────────
export default function ChatPanel({ workspaceId }) {
  const [question, setQuestion] = useState('')
  // Each message: { role: 'user'|'bot', content: string, thinking?: string, error?: bool }
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [rawAccumulated, setRawAccumulated] = useState('') // full raw stream buffer for live parse
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const controllerRef = useRef(null)
  const { notify } = useToast()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, rawAccumulated])

  useEffect(() => {
    return () => controllerRef.current?.abort()
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || isStreaming) return

    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    setQuestion('')
    setRawAccumulated('')
    setIsStreaming(true)

    if (inputRef.current) {
      inputRef.current.style.height = '46px'
    }

    controllerRef.current = new AbortController()

    try {
      const response = await queryRagStream(workspaceId, trimmed, controllerRef.current.signal)

      if (!response.ok) {
        const body = await response.text()
        let detail = 'Query failed'
        try {
          const parsed = JSON.parse(body)
          detail = typeof parsed.detail === 'string' ? parsed.detail : detail
        } catch {
          detail = body || detail
        }
        setMessages(prev => [...prev, { role: 'bot', content: detail, error: true }])
        setIsStreaming(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let accumulated = ''

      while (true) {
        let done, value
        try {
          ;({ done, value } = await reader.read())
        } catch (readErr) {
          // TCP/network drop mid-stream — save whatever we have
          if (readErr.name !== 'AbortError') {
            console.warn('Stream read interrupted:', readErr.message)
            // Treat partial content as the response if we have something useful
            const { thinking, answer } = parseStream(accumulated)
            if (answer || accumulated) {
              setMessages(prev => [
                ...prev,
                {
                  role: 'bot',
                  content: answer || accumulated || '(Connection dropped mid-response)',
                  thinking: thinking || undefined,
                },
              ])
            } else {
              setMessages(prev => [
                ...prev,
                {
                  role: 'bot',
                  content: 'Connection was interrupted. Please try again.',
                  error: true,
                },
              ])
            }
          }
          setRawAccumulated('')
          setIsStreaming(false)
          inputRef.current?.focus()
          return
        }

        if (done) break

        accumulated += decoder.decode(value, { stream: true })
        setRawAccumulated(accumulated)
      }

      // Stream finished cleanly — finalize
      const { thinking, answer } = parseStream(accumulated)
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: answer.trim() || '(No response)',
          thinking: thinking || undefined,
        },
      ])
      setRawAccumulated('')
    } catch (err) {
      if (err.name === 'AbortError') {
        setRawAccumulated('')
        setIsStreaming(false)
        return
      }
      const msg = err.message || 'Streaming failed'
      notify(msg, 'error')
      setMessages(prev => [...prev, { role: 'bot', content: msg, error: true }])
      setRawAccumulated('')
    } finally {
      setIsStreaming(false)
      inputRef.current?.focus()
    }
  }, [question, isStreaming, workspaceId, notify])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {isEmpty && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-60 select-none pointer-events-none">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/15">
              <FileSearch className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">Ask about your documents</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Upload documents using the Docs button, then ask questions about their content.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {/* Live streaming bubble */}
        {isStreaming && rawAccumulated !== undefined && (
          <StreamingBubble rawAccumulated={rawAccumulated} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-slate-800/80 px-4 py-3 bg-slate-950/60 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your workspace documents…"
            disabled={isStreaming}
            className="flex-1 resize-none bg-slate-900 border border-slate-700/80 text-slate-100 text-sm placeholder-slate-500 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50 transition min-h-[46px] max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700"
            style={{ height: '46px' }}
          />
          <button
            type="submit"
            disabled={!question.trim() || isStreaming}
            className="flex-shrink-0 w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition shadow-lg shadow-blue-600/20"
            title="Send (Enter)"
          >
            {isStreaming ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
