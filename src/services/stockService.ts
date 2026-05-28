import { apiRequest } from '@/services/apiClient'
import type { ApiEnvelope, PaginatedData, PaginatedResourceEnvelope } from '@/types/api'
import type { ProductStockScanData, Stock, StockListParams, StockScanResult } from '@/types/stock'

export async function getStocks(token: string, params: StockListParams = {}) {
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

  if (params.lowStock !== null && params.lowStock !== undefined) {
    searchParams.set('low_stock', params.lowStock ? '1' : '0')
  }

  const response = await apiRequest<PaginatedResourceEnvelope<Stock>>(
    `/inventory/stocks?${searchParams.toString()}`,
    {
      method: 'GET',
      token,
    },
  )

  return normalizePaginatedResponse(response)
}

export async function getStock(token: string, id: string | number) {
  const response = await apiRequest<ApiEnvelope<Stock>>(`/inventory/stocks/${id}`, {
    method: 'GET',
    token,
  })

  return response.data
}

export async function scanStockBarcode(token: string, barcode: string) {
  const response = await apiRequest<ApiEnvelope<StockScanResult | ProductStockScanData>>(
    `/inventory/scan/${encodeURIComponent(barcode)}`,
    {
      method: 'GET',
      token,
    },
  )

  return normalizeScanResponse(response.data)
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

function normalizeScanResponse(data: StockScanResult | ProductStockScanData): StockScanResult {
  const envelope = data as Partial<StockScanResult>

  if (envelope.product) {
    return {
      product: envelope.product,
      stocks: Array.isArray(envelope.stocks) ? envelope.stocks : [],
    }
  }

  const productData = data as ProductStockScanData
  const { stocks = [], ...product } = productData

  return {
    product,
    stocks,
  }
}
