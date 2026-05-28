import type { SortDirection } from '@/types/api'
import type { Product } from '@/types/product'
import type { Warehouse } from '@/types/warehouse'

export type Stock = {
  id: number
  product_id: number
  warehouse_id: number
  qty: string | number
  product?: Product | null
  warehouse?: Warehouse | null
  is_low_stock?: boolean
  created_at?: string
  updated_at?: string
}

export type StockScanResult = {
  product: Product
  stocks: Stock[]
}

export type ProductStockScanData = Product & {
  stocks?: Stock[]
}

export type StockSortField = 'id' | 'product_id' | 'warehouse_id' | 'qty' | 'created_at'

export type StockListParams = {
  page?: number
  perPage?: number
  sort?: StockSortField
  direction?: SortDirection
  search?: string
  productId?: number | null
  warehouseId?: number | null
  lowStock?: boolean | null
}
