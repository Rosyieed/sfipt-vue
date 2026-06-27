import type { SortDirection } from '@/types/api'
import type { Product } from '@/types/product'
import type { Unit } from '@/types/unit'

export type BomItem = {
  id: number
  bom_id: number
  material_id: number
  qty_needed: string | number
  unit_id: number | null
  notes: string | null
  material?: Product | null
  unit?: Unit | null
  created_at?: string
  updated_at?: string
}

export type Bom = {
  id: number
  product_id: number
  code: string
  name: string
  description: string | null
  output_qty: string | number
  is_default: boolean
  is_active: boolean
  product?: Product | null
  items?: BomItem[] | null
  created_at?: string
  updated_at?: string
}

export type BomItemPayload = {
  material_id: number | null
  qty_needed: number
  unit_id: number | null
  notes: string | null
}

export type BomPayload = {
  product_id: number | null
  code: string
  name: string
  description: string | null
  output_qty: number
  is_default: boolean
  is_active: boolean
  items: BomItemPayload[]
}

export type BomSortField = 'id' | 'code' | 'name' | 'output_qty' | 'is_default' | 'is_active' | 'created_at'

export type BomListParams = {
  page?: number
  perPage?: number
  sort?: BomSortField
  direction?: SortDirection
  search?: string
  q?: string
  productId?: number | null
  isActive?: boolean | null
}
