import { apiRequest } from '@/services/apiClient'
import type { AuthUser, LoginCredentials, LoginResult } from '@/types/auth'

type ApiObject = Record<string, unknown>

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const response = await apiRequest<ApiObject>('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  return normalizeLoginResponse(response)
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const response = await apiRequest<ApiObject>('/me', {
    method: 'GET',
    token,
  })

  return normalizeUserResponse(response)
}

export async function logout(token: string): Promise<void> {
  await apiRequest('/logout', {
    method: 'POST',
    token,
  })
}

function normalizeLoginResponse(response: ApiObject): LoginResult {
  const payload = getPayload(response)
  const token = getToken(response, payload)

  if (!token) {
    throw new Error('Response login tidak memiliki token.')
  }

  return {
    token,
    user: getUser(response, payload),
  }
}

function normalizeUserResponse(response: ApiObject): AuthUser {
  return getUser(response, getPayload(response)) ?? response
}

function getPayload(response: ApiObject): ApiObject {
  return isApiObject(response.data) ? response.data : response
}

function getToken(response: ApiObject, payload: ApiObject): string | null {
  const token = payload.token ?? response.token ?? payload.access_token ?? response.access_token
  return typeof token === 'string' ? token : null
}

function getUser(response: ApiObject, payload: ApiObject): AuthUser | null {
  const user = payload.user ?? response.user ?? payload
  return isApiObject(user) ? user : null
}

function isApiObject(value: unknown): value is ApiObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
