import type { SortDirection } from '@/types/api'

export type WarehouseType = 'raw' | 'wip' | 'finished' | 'general'

export type Warehouse = {
  id: number
  code: string
  name: string
  location: string | null
  type: WarehouseType
  is_active: boolean
  created_by?: number | null
  updated_by?: number | null
  created_at?: string
  updated_at?: string
}

export type WarehousePayload = {
  code: string
  name: string
  location: string | null
  type: WarehouseType
  is_active: boolean
}

export type WarehouseSortField =
  | 'id'
  | 'code'
  | 'name'
  | 'location'
  | 'type'
  | 'is_active'
  | 'created_at'

export type WarehouseListParams = {
  page?: number
  perPage?: number
  sort?: WarehouseSortField
  direction?: SortDirection
  search?: string
}
