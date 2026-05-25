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
import Toolbar from 'primevue/toolbar'
import ActiveStatusTag from '@/components/common/ActiveStatusTag.vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import WarehouseFormDialog from '@/components/warehouses/WarehouseFormDialog.vue'
import WarehouseTypeTag from '@/components/warehouses/WarehouseTypeTag.vue'
import { ApiError } from '@/services/apiClient'
import * as warehouseService from '@/services/warehouseService'
import { useAuthStore } from '@/stores/auth'
import type { PaginatedData, SortDirection } from '@/types/api'
import type { ApiValidationErrors } from '@/types/auth'
import type {
  Warehouse,
  WarehousePayload,
  WarehouseSortField,
} from '@/types/warehouse'

type WarehouseLoadingRow = {
  id: string
  __loading: true
}

type WarehouseTableRow = Warehouse | WarehouseLoadingRow

const authStore = useAuthStore()
const router = useRouter()
const confirm = useConfirm()

const warehouses = ref<Warehouse[]>([])
const pagination = ref<PaginatedData<Warehouse> | null>(null)
const isLoading = ref(false)
const actionId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const formErrorMessage = ref('')
const validationErrors = ref<ApiValidationErrors>({})
const formMode = ref<'create' | 'edit'>('create')
const selectedWarehouse = ref<Warehouse | null>(null)
const formDialogVisible = ref(false)
const isSubmitting = ref(false)
const currentPage = ref(1)
const perPage = 10
const sortField = ref<WarehouseSortField>('name')
const sortDirection = ref<SortDirection>('asc')
const sortOrder = ref<1 | -1>(1)

const canCreate = computed(() => authStore.hasPermission('warehouses.create'))
const canUpdate = computed(() => authStore.hasPermission('warehouses.update'))
const canDelete = computed(() => authStore.hasPermission('warehouses.delete'))
const canManage = computed(() => canUpdate.value || canDelete.value)
const tableRows = computed<WarehouseTableRow[]>(() => {
  if (isLoading.value) {
    return Array.from({ length: perPage }, (_, index) => ({
      id: `loading-${index}`,
      __loading: true,
    }))
  }

  return warehouses.value
})

onMounted(() => {
  void loadWarehouses()
})

async function loadWarehouses(page = currentPage.value) {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await warehouseService.getWarehouses(authStore.token, {
      page,
      perPage,
      sort: sortField.value,
      direction: sortDirection.value,
    })
    warehouses.value = result.data
    pagination.value = result
    currentPage.value = result.current_page
  } catch (error) {
    await handleApiError(error)
  } finally {
    isLoading.value = false
  }
}

function handlePage(event: { page?: number }) {
  void loadWarehouses((event.page ?? 0) + 1)
}

function handleSort(event: {
  sortField?: string | ((item: Warehouse) => unknown)
  sortOrder?: number | null
}) {
  if (typeof event.sortField !== 'string' || !isWarehouseSortField(event.sortField)) {
    return
  }

  sortField.value = event.sortField
  sortOrder.value = event.sortOrder === -1 ? -1 : 1
  sortDirection.value = sortOrder.value === -1 ? 'desc' : 'asc'
  void loadWarehouses(1)
}

function openCreateDialog() {
  formMode.value = 'create'
  selectedWarehouse.value = null
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

function openEditDialog(warehouse: Warehouse) {
  formMode.value = 'edit'
  selectedWarehouse.value = warehouse
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

async function saveWarehouse(payload: WarehousePayload) {
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
    if (formMode.value === 'edit' && selectedWarehouse.value) {
      await warehouseService.updateWarehouse(authStore.token, selectedWarehouse.value.id, payload)
      successMessage.value = 'Gudang berhasil diperbarui.'
    } else {
      await warehouseService.createWarehouse(authStore.token, payload)
      successMessage.value = 'Gudang berhasil ditambahkan.'
    }

    formDialogVisible.value = false
    await loadWarehouses()
  } catch (error) {
    await handleApiError(error, 'form')
  } finally {
    isSubmitting.value = false
  }
}

function confirmDeleteWarehouse(warehouse: Warehouse) {
  confirm.require({
    header: 'Hapus Gudang',
    message: `Apakah Anda yakin ingin menghapus gudang "${warehouse.name}"?`,
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
      void deleteWarehouse(warehouse)
    },
  })
}

async function deleteWarehouse(warehouse: Warehouse) {
  if (!authStore.token) {
    return
  }

  actionId.value = warehouse.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await warehouseService.deleteWarehouse(authStore.token, warehouse.id)
    successMessage.value = 'Gudang berhasil dihapus.'
    await loadWarehouses()
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
      const message = 'Anda tidak memiliki akses untuk mengelola data gudang.'
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

  const message = 'Data gudang belum bisa diproses. Silakan coba lagi.'
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

function isWarehouseSortField(value: string): value is WarehouseSortField {
  return ['id', 'name', 'location', 'type', 'is_active', 'created_at'].includes(value)
}

function isLoadingRow(row: WarehouseTableRow): row is WarehouseLoadingRow {
  return '__loading' in row
}
</script>

<template>
  <DashboardLayout>
    <section class="app-page">
      <div class="app-page-header">
        <div>
          <p class="app-eyebrow">Master</p>
          <h2 class="app-page-title">Gudang</h2>
          <p class="app-page-description">
            Kelola lokasi penyimpanan bahan baku, barang dalam proses, dan barang jadi.
          </p>
        </div>

        <Button v-if="canCreate" label="Tambah Gudang" @click="openCreateDialog" />
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
              <h3 class="text-base font-semibold text-slate-950">Daftar Gudang</h3>
              <p class="mt-1 text-sm text-slate-500">
                {{ pagination?.total ?? 0 }} gudang terdaftar
              </p>
            </div>
          </template>
          <template #end>
            <Button
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              rounded
              aria-label="Muat ulang data gudang"
              title="Muat ulang data gudang"
              :disabled="isLoading"
              @click="loadWarehouses()"
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
          current-page-report-template="Menampilkan {first} sampai {last} dari {totalRecords} gudang"
          @page="handlePage"
          @sort="handleSort"
        >
          <template #empty>
            <div class="app-empty-state">Belum ada data gudang.</div>
          </template>

          <Column field="name" header="Gudang" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="11rem" />
              <div v-else>
                <p class="font-semibold text-slate-950">{{ data.name }}</p>
              </div>
            </template>
          </Column>
          <Column field="location" header="Lokasi" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="9rem" />
              <span v-else class="text-slate-600">{{ data.location }}</span>
            </template>
          </Column>
          <Column field="type" header="Tipe" header-class="text-center" sortable>
            <template #body="{ data }">
              <div class="flex justify-center">
                <Skeleton
                  v-if="isLoadingRow(data)"
                  height="1.5rem"
                  width="6.5rem"
                  border-radius="999px"
                />
                <WarehouseTypeTag v-else :type="data.type" />
              </div>
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
                  @click="confirmDeleteWarehouse(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <WarehouseFormDialog
        v-model:visible="formDialogVisible"
        :mode="formMode"
        :warehouse="selectedWarehouse"
        :submitting="isSubmitting"
        :errors="validationErrors"
        :message="formErrorMessage"
        @submit="saveWarehouse"
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
