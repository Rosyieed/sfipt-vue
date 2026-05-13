import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authService from '@/services/authService'
import type { AuthUser, LoginCredentials } from '@/types/auth'

const TOKEN_KEY = 'sfipt_token'
const USER_KEY = 'sfipt_user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getStoredToken())
  const user = ref<AuthUser | null>(getStoredUser())
  const isLoading = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value))
  const userName = computed(() => user.value?.name ?? user.value?.email ?? 'User')
  const permissions = computed(() =>
    normalizeNameList(user.value?.all_permissions ?? user.value?.permissions),
  )
  const roles = computed(() => normalizeNameList(user.value?.roles))

  function hasPermission(permission: string) {
    return permissions.value.includes(permission)
  }

  function hasAnyPermission(nextPermissions: string[]) {
    return nextPermissions.some((permission) => hasPermission(permission))
  }

  async function login(credentials: LoginCredentials, remember: boolean) {
    isLoading.value = true

    try {
      const result = await authService.login(credentials)
      setSession(result.token, result.user, remember)

      if (!user.value) {
        setUser(await authService.getCurrentUser(result.token), remember)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCurrentUser() {
    if (!token.value) {
      return null
    }

    setUser(await authService.getCurrentUser(token.value), isRememberedSession())
    return user.value
  }

  async function logout() {
    const currentToken = token.value

    clearSession()

    if (currentToken) {
      await authService.logout(currentToken)
    }
  }

  function setSession(nextToken: string, nextUser: AuthUser | null, remember: boolean) {
    token.value = nextToken
    const storage = remember ? localStorage : sessionStorage
    const otherStorage = remember ? sessionStorage : localStorage

    storage.setItem(TOKEN_KEY, nextToken)
    otherStorage.removeItem(TOKEN_KEY)

    if (nextUser) {
      setUser(nextUser, remember)
    } else {
      storage.removeItem(USER_KEY)
      otherStorage.removeItem(USER_KEY)
    }
  }

  function setUser(nextUser: AuthUser, remember: boolean) {
    user.value = nextUser
    const storage = remember ? localStorage : sessionStorage
    const otherStorage = remember ? sessionStorage : localStorage

    storage.setItem(USER_KEY, JSON.stringify(nextUser))
    otherStorage.removeItem(USER_KEY)
  }

  function clearSession() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  }

  return {
    token,
    user,
    isLoading,
    isAuthenticated,
    userName,
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    login,
    fetchCurrentUser,
    logout,
    clearSession,
  }
})

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as AuthUser
  } catch {
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(USER_KEY)
    return null
  }
}

function isRememberedSession() {
  return Boolean(localStorage.getItem(TOKEN_KEY))
}

function normalizeNameList(value: AuthUser['roles']) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item
      }

      return item.name
    })
    .filter(Boolean)
}
