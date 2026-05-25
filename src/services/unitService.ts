import { apiRequest } from '@/services/apiClient'
import type { ApiEnvelope, PaginatedData } from '@/types/api'
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

  const response = await apiRequest<ApiEnvelope<PaginatedData<Unit>>>(
    `/admin/units?${searchParams.toString()}`,
    {
      method: 'GET',
      token,
    },
  )

  return response.data
}

export async function getUnit(token: string, id: string | number) {
  const response = await apiRequest<ApiEnvelope<Unit>>(`/admin/units/${id}`, {
    method: 'GET',
    token,
  })

  return response.data
}

export async function createUnit(token: string, payload: UnitPayload) {
  const response = await apiRequest<ApiEnvelope<Unit>>('/admin/units', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateUnit(token: string, id: string | number, payload: UnitPayload) {
  const response = await apiRequest<ApiEnvelope<Unit>>(`/admin/units/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}
