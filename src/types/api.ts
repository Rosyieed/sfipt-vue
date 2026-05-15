export type PaginatedData<T> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

export type SortDirection = 'asc' | 'desc'
