import client from './client'

export interface QueryRequest {
  question: string
  document_id: number
}

export interface QueryResponse {
  answer: string
  source: string
}

export const queryDocument = async (
  question: string,
  documentId: number
): Promise<ReadableStream<Uint8Array>> => {
  const response = await client.post(
    '/rag/query',
    {
      question,
      document_id: documentId,
    },
    {
      responseType: 'stream',
    }
  )
  return response.data
}

export const queryDocumentStream = async (
  question: string,
  documentId: number,
  onChunk: (chunk: string) => void
): Promise<void> => {
  const response = await client.post(
    '/rag/query',
    {
      question,
      document_id: documentId,
    }
  )

  // Handle streaming response
  if (response.data) {
    const reader = response.data.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        onChunk(chunk)
      }
    } finally {
      reader.releaseLock()
    }
  }
}
