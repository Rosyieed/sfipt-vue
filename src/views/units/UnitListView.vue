<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
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

const units = ref<Unit[]>([])
const pagination = ref<PaginatedData<Unit> | null>(null)
const isLoading = ref(false)
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
const sortField = ref<UnitSortField>('code')
const sortDirection = ref<SortDirection>('asc')
const sortOrder = ref<1 | -1>(1)

const canCreate = computed(() => authStore.hasPermission('units.create'))
const canUpdate = computed(() => authStore.hasPermission('units.update'))
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
    <section class="mx-auto max-w-7xl">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">Master</p>
          <h2 class="mt-2 text-3xl font-semibold text-slate-950">Satuan</h2>
          <p class="mt-2 text-slate-600">
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

      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <Toolbar class="border-0 border-b border-slate-200 bg-white px-4 py-3">
          <template #start>
            <div>
              <h3 class="text-base font-semibold text-slate-950">Daftar Satuan</h3>
              <p class="mt-1 text-sm text-slate-500">
                {{ pagination?.total ?? 0 }} satuan terdaftar
              </p>
            </div>
          </template>
          <template #end>
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
            <div class="py-8 text-center text-sm text-slate-500">Belum ada data satuan.</div>
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
          <Column v-if="canUpdate" header="Aksi" header-class="text-center" body-class="text-right">
            <template #body="{ data }">
              <div v-if="isLoadingRow(data)" class="flex justify-center">
                <Skeleton height="2rem" width="4rem" />
              </div>
              <div v-else class="flex justify-center">
                <Button
                  label="Edit"
                  severity="info"
                  outlined
                  size="small"
                  @click="openEditDialog(data)"
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
    </section>
  </DashboardLayout>
</template>

<style scoped>
:deep(.p-datatable-column-header-content),
:deep(.p-column-header-content) {
  justify-content: center;
}
</style>
