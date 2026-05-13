export type AuthUser = {
  id?: number | string
  name?: string
  email?: string
  roles?: Array<string | { name: string }>
  permissions?: Array<string | { name: string }>
  all_permissions?: Array<string | { name: string }>
  [key: string]: unknown
}

export type LoginCredentials = {
  email: string
  password: string
}

export type LoginResult = {
  token: string
  user: AuthUser | null
}

export type ApiValidationErrors = Record<string, string[]>
