import type { SortDirection } from '@/types/api'
import type { Product } from '@/types/product'
import type { Warehouse } from '@/types/warehouse'

export type StockMutationType = 'in' | 'out' | 'transfer' | 'adjustment'

export type StockMutation = {
  id: number
  product_id: number
  type: StockMutationType
  from_warehouse_id: number | null
  to_warehouse_id: number | null
  qty: string | number
  reference_no: string | null
  notes: string | null
  product?: Product | null
  from_warehouse?: Warehouse | null
  to_warehouse?: Warehouse | null
  warehouse?: Warehouse | null
  created_by?: number | null
  updated_by?: number | null
  created_at?: string
  updated_at?: string
}

export type StockMutationPayload = {
  product_id: number | null
  type: StockMutationType
  from_warehouse_id?: number | null
  to_warehouse_id?: number | null
  qty: number
  reference_no?: string | null
  notes?: string | null
}

export type StockMutationSortField =
  | 'id'
  | 'product_id'
  | 'type'
  | 'qty'
  | 'created_at'

export type StockMutationListParams = {
  page?: number
  perPage?: number
  sort?: StockMutationSortField
  direction?: SortDirection
  search?: string
  productId?: number | null
  warehouseId?: number | null
  type?: StockMutationType | null
}
