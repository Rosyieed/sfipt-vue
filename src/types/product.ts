import type { SortDirection } from '@/types/api'
import type { Category } from '@/types/category'
import type { Unit } from '@/types/unit'

export type ProductType = 'raw_material' | 'finished_good' | 'semi_finished' | 'packaging'

export type Product = {
  id: number
  sku: string
  barcode: string | null
  name: string
  category_id: number
  unit_id: number
  type: ProductType
  min_stock: string | number
  description: string | null
  is_active: boolean
  category?: Category | null
  unit?: Unit | null
  created_at?: string
  updated_at?: string
}

export type ProductPayload = {
  sku: string
  barcode: string | null
  name: string
  category_id: number | null
  unit_id: number | null
  type: ProductType
  min_stock: number
  description: string | null
  is_active: boolean
}

export type ProductSortField = 'id' | 'sku' | 'name' | 'type' | 'min_stock' | 'is_active' | 'created_at'

export type ProductListParams = {
  page?: number
  perPage?: number
  sort?: ProductSortField
  direction?: SortDirection
  search?: string
  type?: ProductType | null
  categoryId?: number | null
  unitId?: number | null
  isActive?: boolean | null
}
