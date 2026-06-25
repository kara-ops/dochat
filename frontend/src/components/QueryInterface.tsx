import { useState, useEffect } from 'react'
import './QueryInterface.css'

interface Document {
  id: number
  filename: string
  user_id: number
}

interface QueryInterfaceProps {
  token: string
}

export default function QueryInterface({ token }: QueryInterfaceProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocId, setSelectedDocId] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingDocs, setLoadingDocs] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [token])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/rag/documents', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const data = await response.json()
      setDocuments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError('Failed to load documents')
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDocId || !question.trim()) {
      setError('Please select a document and enter a question')
      return
    }

    setLoading(true)
    setError('')
    setAnswer('')

    try {
      const response = await fetch('http://localhost:8000/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: question.trim(),
          document_id: parseInt(selectedDocId),
        }),
      })

      if (!response.ok) {
        throw new Error('Query failed')
      }

      // Read streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let fullAnswer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullAnswer += chunk
          setAnswer(fullAnswer)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="query-container">
      <div className="query-panel">
        <h2>Ask Your Documents</h2>

        <form onSubmit={handleQuery}>
          <div className="form-group">
            <label>Select Document</label>
            {loadingDocs ? (
              <p>Loading documents...</p>
            ) : documents.length > 0 ? (
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
              >
                <option value="">Choose a document...</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.filename}
                  </option>
                ))}
              </select>
            ) : (
              <p className="no-docs">No documents available. Please upload one first.</p>
            )}
          </div>

          <div className="form-group">
            <label>Your Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about the document..."
              rows={4}
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading || !selectedDocId}>
            {loading ? 'Getting Answer...' : 'Ask'}
          </button>
        </form>

        {error && <div className="error-box">{error}</div>}
      </div>

      {answer && (
        <div className="answer-panel">
          <h3>Answer</h3>
          <div className="answer-content">
            {answer}
          </div>
        </div>
      )}
    </div>
  )
}
