<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import RoleFormDialog from '@/components/roles/RoleFormDialog.vue'
import { ApiError } from '@/services/apiClient'
import * as roleService from '@/services/roleService'
import { useAuthStore } from '@/stores/auth'
import type { ApiValidationErrors } from '@/types/auth'
import type { Permission, Role, RolePayload, RoleSortField } from '@/types/role'
import type { SortDirection } from '@/types/warehouse'

type RoleLoadingRow = {
  id: string
  __loading: true
}

type RoleTableRow = Role | RoleLoadingRow

const authStore = useAuthStore()
const router = useRouter()
const confirm = useConfirm()

const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])
const isLoading = ref(false)
const isLoadingPermissions = ref(false)
const actionId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const formErrorMessage = ref('')
const validationErrors = ref<ApiValidationErrors>({})
const formMode = ref<'create' | 'edit'>('create')
const selectedRole = ref<Role | null>(null)
const formDialogVisible = ref(false)
const isSubmitting = ref(false)
const sortField = ref<RoleSortField>('name')
const sortDirection = ref<SortDirection>('asc')
const sortOrder = ref<1 | -1>(1)

const canCreate = computed(() => authStore.hasPermission('roles.create'))
const canUpdate = computed(() => authStore.hasPermission('roles.update'))
const canDelete = computed(() => authStore.hasPermission('roles.delete'))
const canManage = computed(() => canUpdate.value || canDelete.value)
const tableRows = computed<RoleTableRow[]>(() => {
  if (isLoading.value) {
    return Array.from({ length: 6 }, (_, index) => ({
      id: `loading-${index}`,
      __loading: true,
    }))
  }

  return sortedRoles.value
})

const sortedRoles = computed(() => {
  return [...roles.value].sort((first, second) => {
    const firstValue = getSortValue(first, sortField.value)
    const secondValue = getSortValue(second, sortField.value)
    const result = firstValue.localeCompare(secondValue, 'id-ID', {
      numeric: true,
      sensitivity: 'base',
    })

    return sortDirection.value === 'asc' ? result : -result
  })
})

onMounted(() => {
  void loadRoles()
  void loadPermissions()
})

async function loadRoles() {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    roles.value = await roleService.getRoles(authStore.token)
  } catch (error) {
    await handleApiError(error)
  } finally {
    isLoading.value = false
  }
}

async function loadPermissions() {
  if (!authStore.token) {
    return
  }

  isLoadingPermissions.value = true

  try {
    permissions.value = await roleService.getPermissions(authStore.token)
  } catch (error) {
    await handleApiError(error)
  } finally {
    isLoadingPermissions.value = false
  }
}

function handleSort(event: {
  sortField?: string | ((item: Role) => unknown)
  sortOrder?: number | null
}) {
  if (typeof event.sortField !== 'string' || !isRoleSortField(event.sortField)) {
    return
  }

  sortField.value = event.sortField
  sortOrder.value = event.sortOrder === -1 ? -1 : 1
  sortDirection.value = sortOrder.value === -1 ? 'desc' : 'asc'
}

function openCreateDialog() {
  formMode.value = 'create'
  selectedRole.value = null
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

function openEditDialog(role: Role) {
  formMode.value = 'edit'
  selectedRole.value = role
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

async function saveRole(payload: RolePayload) {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  formErrorMessage.value = ''
  validationErrors.value = {}

  try {
    if (formMode.value === 'edit' && selectedRole.value) {
      await roleService.updateRole(authStore.token, selectedRole.value.id, payload)
      successMessage.value = 'Role berhasil diperbarui.'
    } else {
      await roleService.createRole(authStore.token, payload)
      successMessage.value = 'Role berhasil ditambahkan.'
    }

    formDialogVisible.value = false
    await loadRoles()
  } catch (error) {
    await handleApiError(error, 'form')
  } finally {
    isSubmitting.value = false
  }
}

function confirmDeleteRole(role: Role) {
  confirm.require({
    header: 'Hapus Role',
    message: `Apakah Anda yakin ingin menghapus role "${role.name}"?`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Batal',
    acceptLabel: 'Hapus',
    rejectProps: {
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      severity: 'danger',
    },
    accept: () => {
      void deleteRole(role)
    },
  })
}

async function deleteRole(role: Role) {
  if (!authStore.token) {
    return
  }

  actionId.value = role.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await roleService.deleteRole(authStore.token, role.id)
    successMessage.value = 'Role berhasil dihapus.'
    await loadRoles()
  } catch (error) {
    await handleApiError(error, 'page')
  } finally {
    actionId.value = null
  }
}

async function handleApiError(error: unknown, target: 'page' | 'form' = 'page') {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      authStore.clearSession()
      await router.push('/login')
      return
    }

    if (error.status === 403) {
      const message = 'Anda tidak memiliki akses untuk mengelola data role.'
      if (target === 'form') {
        formErrorMessage.value = message
      } else {
        errorMessage.value = message
      }
      return
    }

    if (target === 'form') {
      validationErrors.value = error.errors ?? {}
      formErrorMessage.value = error.message
    } else {
      errorMessage.value = error.message
    }
    return
  }

  const message = 'Data role belum bisa diproses. Silakan coba lagi.'
  if (target === 'form') {
    formErrorMessage.value = message
  } else {
    errorMessage.value = message
  }
}

function formatDate(value?: string) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatPermissions(role: Role) {
  return normalizePermissions(role.permissions)
}

function normalizePermissions(permissions?: Role['permissions']) {
  if (!Array.isArray(permissions)) {
    return []
  }

  return permissions
    .map((permission) => (typeof permission === 'string' ? permission : permission.name))
    .filter(Boolean)
}

function getSortValue(role: Role, field: RoleSortField) {
  if (field === 'created_at') {
    return role.created_at ?? ''
  }

  return String(role[field] ?? '')
}

function isRoleSortField(value: string): value is RoleSortField {
  return ['id', 'name', 'created_at'].includes(value)
}

function isLoadingRow(row: RoleTableRow): row is RoleLoadingRow {
  return '__loading' in row
}
</script>

<template>
  <DashboardLayout>
    <section class="mx-auto max-w-7xl">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">Master</p>
          <h2 class="mt-2 text-3xl font-semibold text-slate-950">Roles</h2>
          <p class="mt-2 text-slate-600">
            Kelola grup akses pengguna dan permission yang melekat pada setiap role.
          </p>
        </div>

        <Button v-if="canCreate" label="Tambah Role" @click="openCreateDialog" />
      </div>

      <Message v-if="errorMessage" class="mb-4" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>
      <Message v-if="successMessage" class="mb-4" severity="success" :closable="false">
        {{ successMessage }}
      </Message>

      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <Toolbar class="border-0 border-b border-slate-200 bg-white px-4 py-3">
          <template #start>
            <div>
              <h3 class="text-base font-semibold text-slate-950">Daftar Role</h3>
              <p class="mt-1 text-sm text-slate-500">{{ roles.length }} role terdaftar</p>
            </div>
          </template>
          <template #end>
            <Button
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              rounded
              aria-label="Muat ulang data role"
              title="Muat ulang data role"
              :disabled="isLoading"
              @click="loadRoles()"
            />
          </template>
        </Toolbar>

        <DataTable
          :value="tableRows"
          :sort-field="sortField"
          :sort-order="sortOrder"
          data-key="id"
          showGridlines
          row-hover
          responsive-layout="scroll"
          @sort="handleSort"
        >
          <template #empty>
            <div class="py-8 text-center text-sm text-slate-500">Belum ada data role.</div>
          </template>

          <Column field="name" header="Role" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="10rem" />
              <div v-else>
                <p class="font-semibold text-slate-950">{{ data.name }}</p>
              </div>
            </template>
          </Column>
          <Column header="Permissions" header-class="text-center">
            <template #body="{ data }">
              <div v-if="isLoadingRow(data)" class="flex flex-wrap gap-2">
                <Skeleton height="1.5rem" width="6rem" border-radius="999px" />
                <Skeleton height="1.5rem" width="7rem" border-radius="999px" />
              </div>
              <div v-else-if="formatPermissions(data).length" class="flex flex-wrap gap-2">
                <Tag
                  v-for="permission in formatPermissions(data).slice(0, 6)"
                  :key="permission"
                  :value="permission"
                  severity="info"
                />
                <Tag
                  v-if="formatPermissions(data).length > 6"
                  :value="`+${formatPermissions(data).length - 6}`"
                  severity="secondary"
                />
              </div>
              <span v-else class="text-slate-500">Belum ada permission</span>
            </template>
          </Column>
          <Column field="created_at" header="Dibuat" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="8rem" />
              <span v-else class="text-slate-600">{{ formatDate(data.created_at) }}</span>
            </template>
          </Column>
          <Column v-if="canManage" header="Aksi" header-class="text-center" body-class="text-right">
            <template #body="{ data }">
              <div v-if="isLoadingRow(data)" class="flex justify-center gap-2">
                <Skeleton height="2rem" width="4rem" />
                <Skeleton height="2rem" width="4.5rem" />
              </div>
              <div v-else class="flex justify-center gap-2">
                <Button
                  v-if="canUpdate"
                  label="Edit"
                  severity="info"
                  outlined
                  size="small"
                  @click="openEditDialog(data)"
                />
                <Button
                  v-if="canDelete"
                  label="Hapus"
                  severity="danger"
                  outlined
                  size="small"
                  :loading="actionId === data.id"
                  :disabled="actionId === data.id"
                  @click="confirmDeleteRole(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <RoleFormDialog
        v-model:visible="formDialogVisible"
        :mode="formMode"
        :role="selectedRole"
        :permissions="permissions"
        :submitting="isSubmitting"
        :loading-permissions="isLoadingPermissions"
        :errors="validationErrors"
        :message="formErrorMessage"
        @submit="saveRole"
      />

      <ConfirmDialog />
    </section>
  </DashboardLayout>
</template>

<style scoped>
:deep(.p-datatable-column-header-content),
:deep(.p-column-header-content) {
  justify-content: center;
}
</style>
