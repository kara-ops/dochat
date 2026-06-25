import client from './client'

export interface LoginResponse {
  access_token: string
  refresh_token?: string
  token_type: string
}

export const signIn = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await client.post('/auth/sign_in', { email, password })
  return response.data
}

export const startGoogleLogin = (): void => {
  window.location.href = '/auth/google/login'
}

export const logout = () => {
  localStorage.removeItem('authToken')
}
