import { apiRequest } from '@/services/apiClient'
import type {
  Permission,
  PermissionListResponse,
  Role,
  RoleListResponse,
  RolePayload,
} from '@/types/role'
import type { ApiEnvelope } from '@/types/api'

export async function getRoles(token: string) {
  const response = await apiRequest<RoleListResponse>('/admin/roles', {
    method: 'GET',
    token,
  })

  return unwrapList(response)
}

export async function getRole(token: string, id: string | number) {
  const response = await apiRequest<ApiEnvelope<Role>>(`/admin/roles/${id}`, {
    method: 'GET',
    token,
  })

  return response.data
}

export async function createRole(token: string, payload: RolePayload) {
  const response = await apiRequest<ApiEnvelope<Role>>('/admin/roles', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateRole(token: string, id: string | number, payload: RolePayload) {
  const response = await apiRequest<ApiEnvelope<Role>>(`/admin/roles/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function deleteRole(token: string, id: string | number) {
  await apiRequest(`/admin/roles/${id}`, {
    method: 'DELETE',
    token,
  })
}

export async function getPermissions(token: string) {
  const response = await apiRequest<PermissionListResponse>('/admin/permissions', {
    method: 'GET',
    token,
  })

  return unwrapList(response)
}

function unwrapList<T>(response: ApiEnvelope<T[]> | T[]) {
  return Array.isArray(response) ? response : response.data
}
