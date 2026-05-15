import type { SortDirection } from '@/types/api'

export type WarehouseType = 'raw' | 'wip' | 'finished'

export type Warehouse = {
  id: number
  name: string
  location: string
  type: WarehouseType
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type WarehousePayload = {
  name: string
  location: string
  type: WarehouseType
  is_active: boolean
}

export type WarehouseSortField = 'id' | 'name' | 'location' | 'type' | 'is_active' | 'created_at'

export type WarehouseListParams = {
  page?: number
  perPage?: number
  sort?: WarehouseSortField
  direction?: SortDirection
}
