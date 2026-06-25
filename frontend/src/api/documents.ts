import client from './client'

export interface Document {
  id: number
  filename: string
  user_id: number
}

export interface UploadResponse {
  task_id: string
  status: string
}

export interface TaskStatus {
  task_id: string
  status: string
}

export const uploadDocument = async (
  workspaceId: number,
  file: File
): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await client.post(
    `/rag/workspaces/${workspaceId}/documents/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data
}

export const getTaskStatus = async (taskId: string): Promise<TaskStatus> => {
  const response = await client.get(`/rag/task/${taskId}`)
  return response.data
}

export const getDocuments = async (): Promise<Document[]> => {
  const response = await client.get('/rag/documents')
  return response.data
}
