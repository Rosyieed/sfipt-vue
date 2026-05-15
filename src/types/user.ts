import type { ApiEnvelope, PaginatedData, SortDirection } from '@/types/api'
import type { Permission, Role } from '@/types/role'

export type User = {
  id: number
  name: string
  email: string
  roles?: Array<string | Role>
  permissions?: Array<string | Permission>
  all_permissions?: Array<string | Permission>
  created_at?: string
  updated_at?: string
}

export type UserPayload = {
  name: string
  email: string
  password?: string
  roles: string[]
  permissions: string[]
}

export type UserSortField = 'id' | 'name' | 'email' | 'created_at'

export type UserListParams = {
  page?: number
  perPage?: number
  sort?: UserSortField
  direction?: SortDirection
}

export type UserListResponse = ApiEnvelope<PaginatedData<User>>
