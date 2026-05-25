import { apiRequest } from '@/services/apiClient'
import type { ApiEnvelope, PaginatedData, PaginatedResourceEnvelope } from '@/types/api'
import type { Warehouse, WarehouseListParams, WarehousePayload } from '@/types/warehouse'

export async function getWarehouses(token: string, params: WarehouseListParams = {}) {
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

  const response = await apiRequest<PaginatedResourceEnvelope<Warehouse>>(
    `/inventory/warehouses?${searchParams.toString()}`,
    {
      method: 'GET',
      token,
    },
  )

  return normalizePaginatedResponse(response)
}

export async function getWarehouse(token: string, id: string | number) {
  const response = await apiRequest<ApiEnvelope<Warehouse>>(`/inventory/warehouses/${id}`, {
    method: 'GET',
    token,
  })

  return response.data
}

export async function createWarehouse(token: string, payload: WarehousePayload) {
  const response = await apiRequest<ApiEnvelope<Warehouse>>('/inventory/warehouses', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateWarehouse(token: string, id: string | number, payload: WarehousePayload) {
  const response = await apiRequest<ApiEnvelope<Warehouse>>(`/inventory/warehouses/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function deleteWarehouse(token: string, id: string | number) {
  await apiRequest(`/inventory/warehouses/${id}`, {
    method: 'DELETE',
    token,
  })
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
