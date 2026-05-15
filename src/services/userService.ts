import { apiRequest } from '@/services/apiClient'
import type { ApiEnvelope } from '@/types/api'
import type { User, UserListParams, UserListResponse, UserPayload } from '@/types/user'

export async function getUsers(token: string, params: UserListParams = {}) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    per_page: String(params.perPage ?? 15),
  })

  if (params.sort) {
    searchParams.set('sort', params.sort)
    searchParams.set('direction', params.direction ?? 'asc')
  }

  const response = await apiRequest<UserListResponse>(`/admin/users?${searchParams.toString()}`, {
    method: 'GET',
    token,
  })

  return response.data
}

export async function getUser(token: string, id: string | number) {
  const response = await apiRequest<ApiEnvelope<User>>(`/admin/users/${id}`, {
    method: 'GET',
    token,
  })

  return response.data
}

export async function createUser(token: string, payload: UserPayload) {
  const response = await apiRequest<ApiEnvelope<User>>('/admin/users', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateUser(token: string, id: string | number, payload: UserPayload) {
  const response = await apiRequest<ApiEnvelope<User>>(`/admin/users/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function deleteUser(token: string, id: string | number) {
  await apiRequest(`/admin/users/${id}`, {
    method: 'DELETE',
    token,
  })
}
