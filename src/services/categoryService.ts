import { apiRequest } from '@/services/apiClient'
import type { ApiEnvelope, PaginatedData } from '@/types/api'
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

  const response = await apiRequest<ApiEnvelope<PaginatedData<Category>>>(
    `/admin/categories?${searchParams.toString()}`,
    {
      method: 'GET',
      token,
    },
  )

  return response.data
}

export async function getCategory(token: string, id: string | number) {
  const response = await apiRequest<ApiEnvelope<Category>>(`/admin/categories/${id}`, {
    method: 'GET',
    token,
  })

  return response.data
}

export async function createCategory(token: string, payload: CategoryPayload) {
  const response = await apiRequest<ApiEnvelope<Category>>('/admin/categories', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateCategory(token: string, id: string | number, payload: CategoryPayload) {
  const response = await apiRequest<ApiEnvelope<Category>>(`/admin/categories/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}
