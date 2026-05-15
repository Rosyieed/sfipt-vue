import type { ApiEnvelope } from '@/types/api'

export type Permission = {
  id: number
  name: string
  created_at?: string
  updated_at?: string
}

export type Role = {
  id: number
  name: string
  permissions?: Array<string | Permission>
  created_at?: string
  updated_at?: string
}

export type RolePayload = {
  name: string
  permissions: string[]
}

export type RoleSortField = 'id' | 'name' | 'created_at'

export type RoleListResponse = ApiEnvelope<Role[]> | Role[]

export type PermissionListResponse = ApiEnvelope<Permission[]> | Permission[]
