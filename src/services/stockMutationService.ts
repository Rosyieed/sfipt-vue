import { apiRequest } from '@/services/apiClient'
import type { ApiEnvelope, PaginatedData, PaginatedResourceEnvelope } from '@/types/api'
import type {
  StockMutation,
  StockMutationListParams,
  StockMutationPayload,
} from '@/types/stockMutation'

export async function getStockMutations(token: string, params: StockMutationListParams = {}) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    per_page: String(params.perPage ?? 15),
  })

  if (params.sort) {
    searchParams.set('sort', params.sort)
    searchParams.set('direction', params.direction ?? 'asc')
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim())
  }

  if (params.productId) {
    searchParams.set('product_id', String(params.productId))
  }

  if (params.warehouseId) {
    searchParams.set('warehouse_id', String(params.warehouseId))
  }

  if (params.type) {
    searchParams.set('type', params.type)
  }

  const response = await apiRequest<PaginatedResourceEnvelope<StockMutation>>(
    `/inventory/mutations?${searchParams.toString()}`,
    {
      method: 'GET',
      token,
    },
  )

  return normalizePaginatedResponse(response)
}

export async function getStockMutation(token: string, id: string | number) {
  const response = await apiRequest<ApiEnvelope<StockMutation>>(`/inventory/mutations/${id}`, {
    method: 'GET',
    token,
  })

  return response.data
}

export async function createStockMutation(token: string, payload: StockMutationPayload) {
  const body = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  )

  const response = await apiRequest<ApiEnvelope<StockMutation>>('/inventory/mutations', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  })

  return response.data
}

function normalizePaginatedResponse<T>(response: PaginatedResourceEnvelope<T>): PaginatedData<T> {
  return {
    data: response.data,
    current_page: response.meta.current_page,
    last_page: response.meta.last_page,
    per_page: response.meta.per_page,
    total: response.meta.total,
  }
}
