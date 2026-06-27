import { apiRequest } from '@/services/apiClient'
import type { ApiEnvelope, PaginatedData, PaginatedResourceEnvelope } from '@/types/api'
import type { Bom, BomListParams, BomPayload } from '@/types/bom'

export async function getBoms(token: string, params: BomListParams = {}) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    per_page: String(params.perPage ?? 15),
  })

  if (params.sort) {
    searchParams.set('sort', params.sort)
    searchParams.set('direction', params.direction ?? 'asc')
  }

  if (params.search?.trim()) {
    searchParams.set('q', params.search.trim())
  } else if (params.q?.trim()) {
    searchParams.set('q', params.q.trim())
  }

  if (params.productId) {
    searchParams.set('product_id', String(params.productId))
  }

  if (params.isActive !== null && params.isActive !== undefined) {
    searchParams.set('is_active', params.isActive ? '1' : '0')
  }

  const response = await apiRequest<PaginatedResourceEnvelope<Bom>>(
    `/production/boms?${searchParams.toString()}`,
    {
      method: 'GET',
      token,
    },
  )

  return normalizePaginatedResponse(response)
}

export async function getBom(token: string, id: string | number) {
  const response = await apiRequest<ApiEnvelope<Bom>>(`/production/boms/${id}`, {
    method: 'GET',
    token,
  })

  return response.data
}

export async function getBomsByProduct(token: string, productId: string | number) {
  const response = await apiRequest<ApiEnvelope<Bom[]>>(
    `/inventory/products/${productId}/boms`,
    {
      method: 'GET',
      token,
    },
  )

  return response.data
}

export async function createBom(token: string, payload: BomPayload) {
  const response = await apiRequest<ApiEnvelope<Bom>>('/production/boms', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateBom(token: string, id: string | number, payload: BomPayload) {
  const response = await apiRequest<ApiEnvelope<Bom>>(`/production/boms/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function deleteBom(token: string, id: string | number) {
  await apiRequest(`/production/boms/${id}`, {
    method: 'DELETE',
    token,
  })
}

function normalizePaginatedResponse<T>(response: PaginatedResourceEnvelope<T>): PaginatedData<T> {
  return {
    data: response.data,
    current_page: Number(response.meta.current_page),
    last_page: Number(response.meta.last_page),
    per_page: Number(response.meta.per_page),
    total: Number(response.meta.total),
  }
}
