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
import UserFormDialog from '@/components/users/UserFormDialog.vue'
import { ApiError } from '@/services/apiClient'
import * as roleService from '@/services/roleService'
import * as userService from '@/services/userService'
import { useAuthStore } from '@/stores/auth'
import type { PaginatedData, SortDirection } from '@/types/api'
import type { ApiValidationErrors } from '@/types/auth'
import type { Permission, Role } from '@/types/role'
import type { User, UserPayload, UserSortField } from '@/types/user'

type UserLoadingRow = {
  id: string
  __loading: true
}

type UserTableRow = User | UserLoadingRow

const authStore = useAuthStore()
const router = useRouter()
const confirm = useConfirm()

const users = ref<User[]>([])
const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])
const pagination = ref<PaginatedData<User> | null>(null)
const isLoading = ref(false)
const isLoadingOptions = ref(false)
const actionId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const formErrorMessage = ref('')
const validationErrors = ref<ApiValidationErrors>({})
const formMode = ref<'create' | 'edit'>('create')
const selectedUser = ref<User | null>(null)
const formDialogVisible = ref(false)
const isSubmitting = ref(false)
const currentPage = ref(1)
const perPage = 10
const sortField = ref<UserSortField>('name')
const sortDirection = ref<SortDirection>('asc')
const sortOrder = ref<1 | -1>(1)

const canCreate = computed(() => authStore.hasPermission('users.create'))
const canUpdate = computed(() => authStore.hasPermission('users.update'))
const canDelete = computed(() => authStore.hasPermission('users.delete'))
const canManage = computed(() => canUpdate.value || canDelete.value)
const tableRows = computed<UserTableRow[]>(() => {
  if (isLoading.value) {
    return Array.from({ length: perPage }, (_, index) => ({
      id: `loading-${index}`,
      __loading: true,
    }))
  }

  return users.value
})

onMounted(() => {
  void loadUsers()
  void loadOptions()
})

async function loadUsers(page = currentPage.value) {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await userService.getUsers(authStore.token, {
      page,
      perPage,
      sort: sortField.value,
      direction: sortDirection.value,
    })
    users.value = result.data
    pagination.value = result
    currentPage.value = result.current_page
  } catch (error) {
    await handleApiError(error)
  } finally {
    isLoading.value = false
  }
}

async function loadOptions() {
  if (!authStore.token) {
    return
  }

  isLoadingOptions.value = true

  try {
    const [nextRoles, nextPermissions] = await Promise.all([
      roleService.getRoles(authStore.token),
      roleService.getPermissions(authStore.token),
    ])
    roles.value = nextRoles
    permissions.value = nextPermissions
  } catch (error) {
    await handleApiError(error)
  } finally {
    isLoadingOptions.value = false
  }
}

function handlePage(event: { page?: number }) {
  void loadUsers((event.page ?? 0) + 1)
}

function handleSort(event: {
  sortField?: string | ((item: User) => unknown)
  sortOrder?: number | null
}) {
  if (typeof event.sortField !== 'string' || !isUserSortField(event.sortField)) {
    return
  }

  sortField.value = event.sortField
  sortOrder.value = event.sortOrder === -1 ? -1 : 1
  sortDirection.value = sortOrder.value === -1 ? 'desc' : 'asc'
  void loadUsers(1)
}

function openCreateDialog() {
  formMode.value = 'create'
  selectedUser.value = null
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

function openEditDialog(user: User) {
  formMode.value = 'edit'
  selectedUser.value = user
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

async function saveUser(payload: UserPayload) {
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
    if (formMode.value === 'edit' && selectedUser.value) {
      await userService.updateUser(authStore.token, selectedUser.value.id, payload)
      successMessage.value = 'User berhasil diperbarui.'
    } else {
      await userService.createUser(authStore.token, payload)
      successMessage.value = 'User berhasil ditambahkan.'
    }

    formDialogVisible.value = false
    await loadUsers()
  } catch (error) {
    await handleApiError(error, 'form')
  } finally {
    isSubmitting.value = false
  }
}

function confirmDeleteUser(user: User) {
  confirm.require({
    header: 'Hapus User',
    message: `Apakah Anda yakin ingin menghapus user "${user.name}"?`,
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
      void deleteUser(user)
    },
  })
}

async function deleteUser(user: User) {
  if (!authStore.token) {
    return
  }

  actionId.value = user.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await userService.deleteUser(authStore.token, user.id)
    successMessage.value = 'User berhasil dihapus.'
    await loadUsers()
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
      const message = 'Anda tidak memiliki akses untuk mengelola data user.'
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

  const message = 'Data user belum bisa diproses. Silakan coba lagi.'
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

function formatNameList(items?: Array<string | Role | Permission>) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((item) => (typeof item === 'string' ? item : item.name)).filter(Boolean)
}

function isUserSortField(value: string): value is UserSortField {
  return ['id', 'name', 'email', 'created_at'].includes(value)
}

function isLoadingRow(row: UserTableRow): row is UserLoadingRow {
  return '__loading' in row
}
</script>

<template>
  <DashboardLayout>
    <section class="app-page">
      <div class="app-page-header">
        <div>
          <p class="app-eyebrow">Master</p>
          <h2 class="app-page-title">Users</h2>
          <p class="app-page-description">
            Kelola akun pengguna, role, dan permission tambahan untuk akses aplikasi.
          </p>
        </div>

        <Button v-if="canCreate" label="Tambah User" @click="openCreateDialog" />
      </div>

      <Message v-if="errorMessage" class="mb-4" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>
      <Message v-if="successMessage" class="mb-4" severity="success" :closable="false">
        {{ successMessage }}
      </Message>

      <div class="app-data-panel">
        <Toolbar>
          <template #start>
            <div>
              <h3 class="text-base font-semibold text-slate-950">Daftar User</h3>
              <p class="mt-1 text-sm text-slate-500">{{ pagination?.total ?? 0 }} user terdaftar</p>
            </div>
          </template>
          <template #end>
            <Button
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              rounded
              aria-label="Muat ulang data user"
              title="Muat ulang data user"
              :disabled="isLoading"
              @click="loadUsers()"
            />
          </template>
        </Toolbar>

        <DataTable
          :value="tableRows"
          :lazy="true"
          :paginator="Boolean(pagination && pagination.total > perPage)"
          :rows="perPage"
          :first="(currentPage - 1) * perPage"
          :sort-field="sortField"
          :sort-order="sortOrder"
          :total-records="pagination?.total ?? 0"
          data-key="id"
          showGridlines
          row-hover
          responsive-layout="scroll"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          current-page-report-template="Menampilkan {first} sampai {last} dari {totalRecords} user"
          @page="handlePage"
          @sort="handleSort"
        >
          <template #empty>
            <div class="app-empty-state">Belum ada data user.</div>
          </template>

          <Column field="name" header="User" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="11rem" />
              <div v-else>
                <p class="font-semibold text-slate-950">{{ data.name }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ data.email }}</p>
              </div>
            </template>
          </Column>
          <Column header="Roles" header-class="text-center">
            <template #body="{ data }">
              <div v-if="isLoadingRow(data)" class="flex flex-wrap gap-2">
                <Skeleton height="1.5rem" width="5rem" border-radius="999px" />
                <Skeleton height="1.5rem" width="6rem" border-radius="999px" />
              </div>
              <div v-else-if="formatNameList(data.roles).length" class="flex flex-wrap gap-2">
                <Tag
                  v-for="role in formatNameList(data.roles)"
                  :key="role"
                  :value="role"
                  severity="success"
                />
              </div>
              <span v-else class="text-slate-500">Belum ada role</span>
            </template>
          </Column>
          <Column header="Permissions" header-class="text-center">
            <template #body="{ data }">
              <div v-if="isLoadingRow(data)" class="flex flex-wrap gap-2">
                <Skeleton height="1.5rem" width="6rem" border-radius="999px" />
                <Skeleton height="1.5rem" width="7rem" border-radius="999px" />
              </div>
              <div v-else-if="formatNameList(data.all_permissions).length" class="flex flex-wrap gap-2">
                <Tag
                  v-for="permission in formatNameList(data.all_permissions).slice(0, 5)"
                  :key="permission"
                  :value="permission"
                  severity="info"
                />
                <Tag
                  v-if="formatNameList(data.all_permissions).length > 5"
                  :value="`+${formatNameList(data.all_permissions).length - 5}`"
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
                  @click="confirmDeleteUser(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <UserFormDialog
        v-model:visible="formDialogVisible"
        :mode="formMode"
        :user="selectedUser"
        :roles="roles"
        :permissions="permissions"
        :submitting="isSubmitting"
        :loading-options="isLoadingOptions"
        :errors="validationErrors"
        :message="formErrorMessage"
        @submit="saveUser"
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
