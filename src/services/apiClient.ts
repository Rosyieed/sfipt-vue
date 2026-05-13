import type { ApiValidationErrors } from '@/types/auth'

type ApiRequestOptions = RequestInit & {
  token?: string | null
}

type ApiErrorPayload = {
  message?: string
  errors?: ApiValidationErrors
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  errors?: ApiValidationErrors

  constructor(status: number, message: string, errors?: ApiValidationErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  headers.set('Accept', 'application/json')

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    const payload = data as ApiErrorPayload | null
    throw new ApiError(
      response.status,
      payload?.message ?? getDefaultErrorMessage(response.status),
      payload?.errors,
    )
  }

  return data as T
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('Content-Type')

  if (contentType?.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { message: text } : null
}

function getDefaultErrorMessage(status: number) {
  if (status === 401) {
    return 'Email atau password tidak valid.'
  }

  if (status === 422) {
    return 'Data yang dikirim belum valid.'
  }

  return 'Terjadi kesalahan. Silakan coba lagi.'
}
