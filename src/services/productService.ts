import { apiRequest } from '@/services/apiClient'
import type { ApiEnvelope, PaginatedData, PaginatedResourceEnvelope } from '@/types/api'
import type { Product, ProductListParams, ProductPayload } from '@/types/product'

export async function getProducts(token: string, params: ProductListParams = {}) {
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

  if (params.type) {
    searchParams.set('type', params.type)
  }

  if (params.categoryId) {
    searchParams.set('category_id', String(params.categoryId))
  }

  if (params.unitId) {
    searchParams.set('unit_id', String(params.unitId))
  }

  if (params.isActive !== null && params.isActive !== undefined) {
    searchParams.set('is_active', params.isActive ? '1' : '0')
  }

  const response = await apiRequest<PaginatedResourceEnvelope<Product>>(
    `/inventory/products?${searchParams.toString()}`,
    {
      method: 'GET',
      token,
    },
  )

  return normalizePaginatedResponse(response)
}

export async function getProduct(token: string, id: string | number) {
  const response = await apiRequest<ApiEnvelope<Product>>(`/inventory/products/${id}`, {
    method: 'GET',
    token,
  })

  return response.data
}

export async function getProductByBarcode(token: string, barcode: string) {
  const response = await apiRequest<ApiEnvelope<Product>>(
    `/inventory/products/barcode/${encodeURIComponent(barcode)}`,
    {
      method: 'GET',
      token,
    },
  )

  return response.data
}

export async function createProduct(token: string, payload: ProductPayload) {
  const response = await apiRequest<ApiEnvelope<Product>>('/inventory/products', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateProduct(token: string, id: string | number, payload: ProductPayload) {
  const response = await apiRequest<ApiEnvelope<Product>>(`/inventory/products/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function deleteProduct(token: string, id: string | number) {
  await apiRequest(`/inventory/products/${id}`, {
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
