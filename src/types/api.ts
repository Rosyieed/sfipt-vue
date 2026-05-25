export type PaginatedData<T> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type PaginationMeta = {
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

export type PaginatedResourceEnvelope<T> = ApiEnvelope<T[]> & {
  meta: PaginationMeta
}

export type SortDirection = 'asc' | 'desc'
