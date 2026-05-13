import { apiRequest } from '@/services/apiClient'
import type {
  ApiEnvelope,
  PaginatedData,
  Warehouse,
  WarehouseListParams,
  WarehousePayload,
} from '@/types/warehouse'

export async function getWarehouses(token: string, params: WarehouseListParams = {}) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    per_page: String(params.perPage ?? 15),
  })

  if (params.sort) {
    searchParams.set('sort', params.sort)
    searchParams.set('direction', params.direction ?? 'asc')
  }

  const response = await apiRequest<ApiEnvelope<PaginatedData<Warehouse>>>(
    `/admin/warehouses?${searchParams.toString()}`,
    {
      method: 'GET',
      token,
    },
  )

  return response.data
}

export async function getWarehouse(token: string, id: string | number) {
  const response = await apiRequest<ApiEnvelope<Warehouse>>(`/admin/warehouses/${id}`, {
    method: 'GET',
    token,
  })

  return response.data
}

export async function createWarehouse(token: string, payload: WarehousePayload) {
  const response = await apiRequest<ApiEnvelope<Warehouse>>('/admin/warehouses', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateWarehouse(token: string, id: string | number, payload: WarehousePayload) {
  const response = await apiRequest<ApiEnvelope<Warehouse>>(`/admin/warehouses/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function deleteWarehouse(token: string, id: string | number) {
  await apiRequest(`/admin/warehouses/${id}`, {
    method: 'DELETE',
    token,
  })
}
