import type { SortDirection } from '@/types/api'

export type Category = {
  id: number
  code: string
  name: string
  description: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type CategoryPayload = {
  code: string
  name: string
  description: string | null
  is_active: boolean
}

export type CategorySortField = 'id' | 'code' | 'name' | 'is_active' | 'created_at'

export type CategoryListParams = {
  page?: number
  perPage?: number
  sort?: CategorySortField
  direction?: SortDirection
}
