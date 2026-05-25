<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Toolbar from 'primevue/toolbar'
import CategoryFormDialog from '@/components/categories/CategoryFormDialog.vue'
import ActiveStatusTag from '@/components/common/ActiveStatusTag.vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { ApiError } from '@/services/apiClient'
import * as categoryService from '@/services/categoryService'
import { useAuthStore } from '@/stores/auth'
import type { PaginatedData, SortDirection } from '@/types/api'
import type { ApiValidationErrors } from '@/types/auth'
import type { Category, CategoryPayload, CategorySortField } from '@/types/category'

type CategoryLoadingRow = {
  id: string
  __loading: true
}

type CategoryTableRow = Category | CategoryLoadingRow

const authStore = useAuthStore()
const router = useRouter()
const confirm = useConfirm()

const categories = ref<Category[]>([])
const pagination = ref<PaginatedData<Category> | null>(null)
const isLoading = ref(false)
const actionId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const formErrorMessage = ref('')
const validationErrors = ref<ApiValidationErrors>({})
const formMode = ref<'create' | 'edit'>('create')
const selectedCategory = ref<Category | null>(null)
const formDialogVisible = ref(false)
const isSubmitting = ref(false)
const currentPage = ref(1)
const perPage = 10
const searchQuery = ref('')
const activeSearch = ref('')
const sortField = ref<CategorySortField>('code')
const sortDirection = ref<SortDirection>('asc')
const sortOrder = ref<1 | -1>(1)

const canCreate = computed(() => authStore.hasPermission('categories.create'))
const canUpdate = computed(() => authStore.hasPermission('categories.update'))
const canDelete = computed(() => authStore.hasPermission('categories.delete'))
const canManage = computed(() => canUpdate.value || canDelete.value)
const tableRows = computed<CategoryTableRow[]>(() => {
  if (isLoading.value) {
    return Array.from({ length: perPage }, (_, index) => ({
      id: `loading-${index}`,
      __loading: true,
    }))
  }

  return categories.value
})

onMounted(() => {
  void loadCategories()
})

async function loadCategories(page = currentPage.value) {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await categoryService.getCategories(authStore.token, {
      page,
      perPage,
      sort: sortField.value,
      direction: sortDirection.value,
      search: activeSearch.value,
    })
    categories.value = result.data
    pagination.value = result
    currentPage.value = result.current_page
  } catch (error) {
    await handleApiError(error)
  } finally {
    isLoading.value = false
  }
}

function handlePage(event: { page?: number }) {
  void loadCategories((event.page ?? 0) + 1)
}

function applySearch() {
  activeSearch.value = searchQuery.value.trim()
  void loadCategories(1)
}

function clearSearch() {
  searchQuery.value = ''
  activeSearch.value = ''
  void loadCategories(1)
}

function handleSort(event: {
  sortField?: string | ((item: Category) => unknown)
  sortOrder?: number | null
}) {
  if (typeof event.sortField !== 'string' || !isCategorySortField(event.sortField)) {
    return
  }

  sortField.value = event.sortField
  sortOrder.value = event.sortOrder === -1 ? -1 : 1
  sortDirection.value = sortOrder.value === -1 ? 'desc' : 'asc'
  void loadCategories(1)
}

function openCreateDialog() {
  formMode.value = 'create'
  selectedCategory.value = null
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

function openEditDialog(category: Category) {
  formMode.value = 'edit'
  selectedCategory.value = category
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

async function saveCategory(payload: CategoryPayload) {
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
    if (formMode.value === 'edit' && selectedCategory.value) {
      await categoryService.updateCategory(authStore.token, selectedCategory.value.id, payload)
      successMessage.value = 'Kategori berhasil diperbarui.'
    } else {
      await categoryService.createCategory(authStore.token, payload)
      successMessage.value = 'Kategori berhasil ditambahkan.'
    }

    formDialogVisible.value = false
    await loadCategories()
  } catch (error) {
    await handleApiError(error, 'form')
  } finally {
    isSubmitting.value = false
  }
}

function confirmDeleteCategory(category: Category) {
  confirm.require({
    header: 'Hapus Kategori',
    message: `Apakah Anda yakin ingin menghapus kategori "${category.name}"?`,
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
      void deleteCategory(category)
    },
  })
}

async function deleteCategory(category: Category) {
  if (!authStore.token) {
    return
  }

  actionId.value = category.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await categoryService.deleteCategory(authStore.token, category.id)
    successMessage.value = 'Kategori berhasil dihapus.'
    await loadCategories()
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
      const message = 'Anda tidak memiliki akses untuk mengelola data kategori.'
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

  const message = 'Data kategori belum bisa diproses. Silakan coba lagi.'
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

function formatDescription(value: string | null) {
  return value?.trim() || '-'
}

function isCategorySortField(value: string): value is CategorySortField {
  return ['id', 'code', 'name', 'is_active', 'created_at'].includes(value)
}

function isLoadingRow(row: CategoryTableRow): row is CategoryLoadingRow {
  return '__loading' in row
}
</script>

<template>
  <DashboardLayout>
    <section class="app-page">
      <div class="app-page-header">
        <div>
          <p class="app-eyebrow">Master</p>
          <h2 class="app-page-title">Kategori</h2>
          <p class="app-page-description">
            Kelola kategori material dan barang untuk kebutuhan inventori produksi.
          </p>
        </div>

        <Button v-if="canCreate" label="Tambah Kategori" @click="openCreateDialog" />
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
              <h3 class="text-base font-semibold text-slate-950">Daftar Kategori</h3>
              <p class="mt-1 text-sm text-slate-500">
                {{ pagination?.total ?? 0 }} kategori terdaftar
              </p>
            </div>
          </template>
          <template #end>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span class="p-input-icon-left">
                <InputText
                  v-model="searchQuery"
                  class="w-full sm:w-64"
                  placeholder="Cari kategori"
                  :disabled="isLoading"
                  @keydown.enter.prevent="applySearch"
                />
              </span>
              <div class="flex gap-2">
                <Button
                  icon="pi pi-search"
                  severity="secondary"
                  outlined
                  aria-label="Cari kategori"
                  title="Cari kategori"
                  :disabled="isLoading"
                  @click="applySearch"
                />
                <Button
                  v-if="activeSearch"
                  icon="pi pi-times"
                  severity="secondary"
                  outlined
                  aria-label="Hapus pencarian kategori"
                  title="Hapus pencarian kategori"
                  :disabled="isLoading"
                  @click="clearSearch"
                />
                <Button
                  icon="pi pi-refresh"
                  severity="secondary"
                  outlined
                  rounded
                  aria-label="Muat ulang data kategori"
                  title="Muat ulang data kategori"
                  :disabled="isLoading"
                  @click="loadCategories()"
                />
              </div>
            </div>
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
          current-page-report-template="Menampilkan {first} sampai {last} dari {totalRecords} kategori"
          @page="handlePage"
          @sort="handleSort"
        >
          <template #empty>
            <div class="app-empty-state">Belum ada data kategori.</div>
          </template>

          <Column field="code" header="Kode" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="5rem" />
              <span v-else class="font-semibold text-slate-950">{{ data.code }}</span>
            </template>
          </Column>
          <Column field="name" header="Nama" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="11rem" />
              <span v-else class="font-semibold text-slate-950">{{ data.name }}</span>
            </template>
          </Column>
          <Column header="Deskripsi" header-class="text-center">
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="14rem" />
              <span v-else class="text-slate-600">{{ formatDescription(data.description) }}</span>
            </template>
          </Column>
          <Column field="is_active" header="Status" header-class="text-center" sortable>
            <template #body="{ data }">
              <div class="flex justify-center">
                <Skeleton
                  v-if="isLoadingRow(data)"
                  height="1.5rem"
                  width="5rem"
                  border-radius="999px"
                />
                <ActiveStatusTag v-else :active="data.is_active" />
              </div>
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
                  @click="confirmDeleteCategory(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <CategoryFormDialog
        v-model:visible="formDialogVisible"
        :mode="formMode"
        :category="selectedCategory"
        :submitting="isSubmitting"
        :errors="validationErrors"
        :message="formErrorMessage"
        @submit="saveCategory"
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
