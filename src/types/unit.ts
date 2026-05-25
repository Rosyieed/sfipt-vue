import type { SortDirection } from '@/types/api'

export type Unit = {
  id: number
  code: string
  name: string
  description: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type UnitPayload = {
  code: string
  name: string
  description: string | null
  is_active: boolean
}

export type UnitSortField = 'id' | 'code' | 'name' | 'is_active' | 'created_at'

export type UnitListParams = {
  page?: number
  perPage?: number
  sort?: UnitSortField
  direction?: SortDirection
  search?: string
}
