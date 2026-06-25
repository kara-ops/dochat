import client from './client'

export interface WorkspaceCreateRequest {
  name: string
}

export interface WorkspaceResponse {
  id: number
  name: string
  owner_id: number
  created_at: string
}

export const createWorkspace = async (
  name: string
): Promise<WorkspaceResponse> => {
  const response = await client.post('/rag/workspaces', { name })
  return response.data
}

export const getMyWorkspaces = async (): Promise<WorkspaceResponse[]> => {
  const response = await client.get('/rag/myWorkspace')
  return response.data
}
