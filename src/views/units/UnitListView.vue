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
import ActiveStatusTag from '@/components/common/ActiveStatusTag.vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import UnitFormDialog from '@/components/units/UnitFormDialog.vue'
import { ApiError } from '@/services/apiClient'
import * as unitService from '@/services/unitService'
import { useAuthStore } from '@/stores/auth'
import type { PaginatedData, SortDirection } from '@/types/api'
import type { ApiValidationErrors } from '@/types/auth'
import type { Unit, UnitPayload, UnitSortField } from '@/types/unit'

type UnitLoadingRow = {
  id: string
  __loading: true
}

type UnitTableRow = Unit | UnitLoadingRow

const authStore = useAuthStore()
const router = useRouter()
const confirm = useConfirm()

const units = ref<Unit[]>([])
const pagination = ref<PaginatedData<Unit> | null>(null)
const isLoading = ref(false)
const actionId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const formErrorMessage = ref('')
const validationErrors = ref<ApiValidationErrors>({})
const formMode = ref<'create' | 'edit'>('create')
const selectedUnit = ref<Unit | null>(null)
const formDialogVisible = ref(false)
const isSubmitting = ref(false)
const currentPage = ref(1)
const perPage = 10
const searchQuery = ref('')
const activeSearch = ref('')
const sortField = ref<UnitSortField>('code')
const sortDirection = ref<SortDirection>('asc')
const sortOrder = ref<1 | -1>(1)

const canCreate = computed(() => authStore.hasPermission('units.create'))
const canUpdate = computed(() => authStore.hasPermission('units.update'))
const canDelete = computed(() => authStore.hasPermission('units.delete'))
const canManage = computed(() => canUpdate.value || canDelete.value)
const tableRows = computed<UnitTableRow[]>(() => {
  if (isLoading.value) {
    return Array.from({ length: perPage }, (_, index) => ({
      id: `loading-${index}`,
      __loading: true,
    }))
  }

  return units.value
})

onMounted(() => {
  void loadUnits()
})

async function loadUnits(page = currentPage.value) {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await unitService.getUnits(authStore.token, {
      page,
      perPage,
      sort: sortField.value,
      direction: sortDirection.value,
      search: activeSearch.value,
    })
    units.value = result.data
    pagination.value = result
    currentPage.value = result.current_page
  } catch (error) {
    await handleApiError(error)
  } finally {
    isLoading.value = false
  }
}

function handlePage(event: { page?: number }) {
  void loadUnits((event.page ?? 0) + 1)
}

function applySearch() {
  activeSearch.value = searchQuery.value.trim()
  void loadUnits(1)
}

function clearSearch() {
  searchQuery.value = ''
  activeSearch.value = ''
  void loadUnits(1)
}

function handleSort(event: {
  sortField?: string | ((item: Unit) => unknown)
  sortOrder?: number | null
}) {
  if (typeof event.sortField !== 'string' || !isUnitSortField(event.sortField)) {
    return
  }

  sortField.value = event.sortField
  sortOrder.value = event.sortOrder === -1 ? -1 : 1
  sortDirection.value = sortOrder.value === -1 ? 'desc' : 'asc'
  void loadUnits(1)
}

function openCreateDialog() {
  formMode.value = 'create'
  selectedUnit.value = null
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

function openEditDialog(unit: Unit) {
  formMode.value = 'edit'
  selectedUnit.value = unit
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

async function saveUnit(payload: UnitPayload) {
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
    if (formMode.value === 'edit' && selectedUnit.value) {
      await unitService.updateUnit(authStore.token, selectedUnit.value.id, payload)
      successMessage.value = 'Satuan berhasil diperbarui.'
    } else {
      await unitService.createUnit(authStore.token, payload)
      successMessage.value = 'Satuan berhasil ditambahkan.'
    }

    formDialogVisible.value = false
    await loadUnits()
  } catch (error) {
    await handleApiError(error, 'form')
  } finally {
    isSubmitting.value = false
  }
}

function confirmDeleteUnit(unit: Unit) {
  confirm.require({
    header: 'Hapus Satuan',
    message: `Apakah Anda yakin ingin menghapus satuan "${unit.name}"?`,
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
      void deleteUnit(unit)
    },
  })
}

async function deleteUnit(unit: Unit) {
  if (!authStore.token) {
    return
  }

  actionId.value = unit.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await unitService.deleteUnit(authStore.token, unit.id)
    successMessage.value = 'Satuan berhasil dihapus.'
    await loadUnits()
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
      const message = 'Anda tidak memiliki akses untuk mengelola data satuan.'
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

  const message = 'Data satuan belum bisa diproses. Silakan coba lagi.'
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

function isUnitSortField(value: string): value is UnitSortField {
  return ['id', 'code', 'name', 'is_active', 'created_at'].includes(value)
}

function isLoadingRow(row: UnitTableRow): row is UnitLoadingRow {
  return '__loading' in row
}
</script>

<template>
  <DashboardLayout>
    <section class="app-page">
      <div class="app-page-header">
        <div>
          <p class="app-eyebrow">Master</p>
          <h2 class="app-page-title">Satuan</h2>
          <p class="app-page-description">
            Kelola satuan ukur untuk material, barang, dan kebutuhan inventori produksi.
          </p>
        </div>

        <Button v-if="canCreate" label="Tambah Satuan" @click="openCreateDialog" />
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
              <h3 class="text-base font-semibold text-slate-950">Daftar Satuan</h3>
              <p class="mt-1 text-sm text-slate-500">
                {{ pagination?.total ?? 0 }} satuan terdaftar
              </p>
            </div>
          </template>
          <template #end>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span class="p-input-icon-left">
                <InputText
                  v-model="searchQuery"
                  class="w-full sm:w-64"
                  placeholder="Cari satuan"
                  :disabled="isLoading"
                  @keydown.enter.prevent="applySearch"
                />
              </span>
              <div class="flex gap-2">
                <Button
                  icon="pi pi-search"
                  severity="secondary"
                  outlined
                  aria-label="Cari satuan"
                  title="Cari satuan"
                  :disabled="isLoading"
                  @click="applySearch"
                />
                <Button
                  v-if="activeSearch"
                  icon="pi pi-times"
                  severity="secondary"
                  outlined
                  aria-label="Hapus pencarian satuan"
                  title="Hapus pencarian satuan"
                  :disabled="isLoading"
                  @click="clearSearch"
                />
                <Button
                  icon="pi pi-refresh"
                  severity="secondary"
                  outlined
                  rounded
                  aria-label="Muat ulang data satuan"
                  title="Muat ulang data satuan"
                  :disabled="isLoading"
                  @click="loadUnits()"
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
          current-page-report-template="Menampilkan {first} sampai {last} dari {totalRecords} satuan"
          @page="handlePage"
          @sort="handleSort"
        >
          <template #empty>
            <div class="app-empty-state">Belum ada data satuan.</div>
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
                  @click="confirmDeleteUnit(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <UnitFormDialog
        v-model:visible="formDialogVisible"
        :mode="formMode"
        :unit="selectedUnit"
        :submitting="isSubmitting"
        :errors="validationErrors"
        :message="formErrorMessage"
        @submit="saveUnit"
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
