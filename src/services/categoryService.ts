import { apiRequest } from '@/services/apiClient'
import type { ApiEnvelope, PaginatedData, PaginatedResourceEnvelope } from '@/types/api'
import type { Category, CategoryListParams, CategoryPayload } from '@/types/category'

export async function getCategories(token: string, params: CategoryListParams = {}) {
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

  const response = await apiRequest<PaginatedResourceEnvelope<Category>>(
    `/inventory/categories?${searchParams.toString()}`,
    {
      method: 'GET',
      token,
    },
  )

  return normalizePaginatedResponse(response)
}

export async function getCategory(token: string, id: string | number) {
  const response = await apiRequest<ApiEnvelope<Category>>(`/inventory/categories/${id}`, {
    method: 'GET',
    token,
  })

  return response.data
}

export async function createCategory(token: string, payload: CategoryPayload) {
  const response = await apiRequest<ApiEnvelope<Category>>('/inventory/categories', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateCategory(token: string, id: string | number, payload: CategoryPayload) {
  const response = await apiRequest<ApiEnvelope<Category>>(`/inventory/categories/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function deleteCategory(token: string, id: string | number) {
  await apiRequest(`/inventory/categories/${id}`, {
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
