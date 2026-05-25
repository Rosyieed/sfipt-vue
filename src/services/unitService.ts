import { apiRequest } from '@/services/apiClient'
import type { ApiEnvelope, PaginatedData, PaginatedResourceEnvelope } from '@/types/api'
import type { Unit, UnitListParams, UnitPayload } from '@/types/unit'

export async function getUnits(token: string, params: UnitListParams = {}) {
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

  const response = await apiRequest<PaginatedResourceEnvelope<Unit>>(
    `/inventory/units?${searchParams.toString()}`,
    {
      method: 'GET',
      token,
    },
  )

  return normalizePaginatedResponse(response)
}

export async function getUnit(token: string, id: string | number) {
  const response = await apiRequest<ApiEnvelope<Unit>>(`/inventory/units/${id}`, {
    method: 'GET',
    token,
  })

  return response.data
}

export async function createUnit(token: string, payload: UnitPayload) {
  const response = await apiRequest<ApiEnvelope<Unit>>('/inventory/units', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateUnit(token: string, id: string | number, payload: UnitPayload) {
  const response = await apiRequest<ApiEnvelope<Unit>>(`/inventory/units/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function deleteUnit(token: string, id: string | number) {
  await apiRequest(`/inventory/units/${id}`, {
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
