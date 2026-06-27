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
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import Toolbar from 'primevue/toolbar'
import ActiveStatusTag from '@/components/common/ActiveStatusTag.vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import BomFormDialog from '@/components/boms/BomFormDialog.vue'
import { ApiError } from '@/services/apiClient'
import * as bomService from '@/services/bomService'
import * as productService from '@/services/productService'
import * as unitService from '@/services/unitService'
import { useAuthStore } from '@/stores/auth'
import type { PaginatedData, SortDirection } from '@/types/api'
import type { ApiValidationErrors } from '@/types/auth'
import type { Product } from '@/types/product'
import type { Unit } from '@/types/unit'
import type { Bom, BomPayload, BomSortField } from '@/types/bom'

type BomLoadingRow = {
  id: string
  __loading: true
}

type BomTableRow = Bom | BomLoadingRow

type FilterOption<T> = {
  label: string
  value: T
}

const authStore = useAuthStore()
const router = useRouter()
const confirm = useConfirm()

const boms = ref<Bom[]>([])
const products = ref<Product[]>([])
const units = ref<Unit[]>([])
const pagination = ref<PaginatedData<Bom> | null>(null)

const isLoading = ref(false)
const isLoadingReferences = ref(false)
const actionId = ref<number | null>(null)
const errorMessage = ref('')
const referenceMessage = ref('')
const successMessage = ref('')
const formErrorMessage = ref('')
const validationErrors = ref<ApiValidationErrors>({})

const formMode = ref<'create' | 'edit'>('create')
const selectedBom = ref<Bom | null>(null)
const formDialogVisible = ref(false)
const isSubmitting = ref(false)

const currentPage = ref(1)
const perPage = 10
const searchQuery = ref('')
const activeSearch = ref('')
const selectedActiveStatus = ref<boolean | null>(null)
const activeStatus = ref<boolean | null>(null)

const sortField = ref<BomSortField>('code')
const sortDirection = ref<SortDirection>('asc')
const sortOrder = ref<1 | -1>(1)

const expandedRows = ref<Record<string, boolean>>({})

const canCreate = computed(() => authStore.hasPermission('boms.create'))
const canUpdate = computed(() => authStore.hasPermission('boms.update'))
const canDelete = computed(() => authStore.hasPermission('boms.delete'))
const canManage = computed(() => canUpdate.value || canDelete.value)

const hasActiveFilters = computed(() => Boolean(activeSearch.value || activeStatus.value !== null))

const tableRows = computed<BomTableRow[]>(() => {
  if (isLoading.value) {
    return Array.from({ length: perPage }, (_, index) => ({
      id: `loading-${index}`,
      __loading: true,
    }))
  }
  return boms.value
})

const activeOptions: Array<FilterOption<boolean | null>> = [
  { label: 'Semua status', value: null },
  { label: 'Aktif', value: true },
  { label: 'Nonaktif', value: false },
]

onMounted(() => {
  void loadInitialData()
})

async function loadInitialData() {
  await Promise.all([loadReferences(), loadBoms()])
}

async function loadReferences() {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isLoadingReferences.value = true
  referenceMessage.value = ''

  try {
    const [productResult, unitResult] = await Promise.all([
      productService.getProducts(authStore.token, {
        page: 1,
        perPage: 1000,
        isActive: true,
      }),
      unitService.getUnits(authStore.token, {
        page: 1,
        perPage: 1000,
      }),
    ])

    products.value = productResult.data
    units.value = unitResult.data.filter((u) => u.is_active)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      authStore.clearSession()
      await router.push('/login')
      return
    }
    referenceMessage.value =
      'Referensi produk dan satuan belum bisa dimuat. Form pembuatan BOM mungkin tidak lengkap.'
  } finally {
    isLoadingReferences.value = false
  }
}

async function loadBoms(page = currentPage.value) {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await bomService.getBoms(authStore.token, {
      page,
      perPage,
      sort: sortField.value,
      direction: sortDirection.value,
      search: activeSearch.value,
      isActive: activeStatus.value,
    })
    boms.value = result.data
    pagination.value = result
    currentPage.value = result.current_page
  } catch (error) {
    await handleApiError(error)
  } finally {
    isLoading.value = false
  }
}

function handlePage(event: { page?: number }) {
  void loadBoms((event.page ?? 0) + 1)
}

function applyFilters() {
  activeSearch.value = searchQuery.value.trim()
  activeStatus.value = selectedActiveStatus.value
  void loadBoms(1)
}

function clearFilters() {
  searchQuery.value = ''
  activeSearch.value = ''
  selectedActiveStatus.value = null
  activeStatus.value = null
  void loadBoms(1)
}

function handleSort(event: {
  sortField?: string | ((item: Bom) => unknown)
  sortOrder?: number | null
}) {
  if (typeof event.sortField !== 'string' || !isBomSortField(event.sortField)) {
    return
  }

  sortField.value = event.sortField
  sortOrder.value = event.sortOrder === -1 ? -1 : 1
  sortDirection.value = sortOrder.value === -1 ? 'desc' : 'asc'
  void loadBoms(1)
}

function isBomSortField(field: string): field is BomSortField {
  return ['id', 'code', 'name', 'output_qty', 'is_default', 'is_active', 'created_at'].includes(
    field,
  )
}

function openCreateDialog() {
  formMode.value = 'create'
  selectedBom.value = null
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

function openEditDialog(bom: Bom) {
  formMode.value = 'edit'
  selectedBom.value = bom
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

async function handleFormSubmit(payload: BomPayload) {
  if (!authStore.token) return

  isSubmitting.value = true
  formErrorMessage.value = ''
  validationErrors.value = {}

  try {
    if (formMode.value === 'create') {
      await bomService.createBom(authStore.token, payload)
      showSuccessToast('BOM berhasil dibuat.')
    } else if (formMode.value === 'edit' && selectedBom.value) {
      await bomService.updateBom(authStore.token, selectedBom.value.id, payload)
      showSuccessToast('BOM berhasil diperbarui.')
    }

    formDialogVisible.value = false
    void loadBoms()
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 422 && error.errors) {
        validationErrors.value = error.errors
        formErrorMessage.value = error.message || 'Data yang diisi belum valid.'
      } else {
        formErrorMessage.value = error.message
      }
    } else {
      formErrorMessage.value = 'Terjadi kesalahan sistem.'
    }
  } finally {
    isSubmitting.value = false
  }
}

function confirmDelete(bom: Bom) {
  confirm.require({
    message: `Apakah Anda yakin ingin menghapus BOM "${bom.code} - ${bom.name}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Batal',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Hapus',
      severity: 'danger',
    },
    accept: () => {
      void executeDelete(bom)
    },
  })
}

async function executeDelete(bom: Bom) {
  if (!authStore.token) return

  actionId.value = bom.id
  errorMessage.value = ''

  try {
    await bomService.deleteBom(authStore.token, bom.id)
    showSuccessToast('BOM berhasil dihapus.')
    void loadBoms()
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Gagal menghapus BOM. Silakan coba lagi.'
    }
  } finally {
    actionId.value = null
  }
}

async function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      authStore.clearSession()
      await router.push('/login')
    } else {
      errorMessage.value = error.message
    }
  } else {
    errorMessage.value = 'Terjadi kesalahan koneksi.'
  }
}

function showSuccessToast(msg: string) {
  successMessage.value = msg
  setTimeout(() => {
    successMessage.value = ''
  }, 4000)
}
</script>

<template>
  <DashboardLayout>
    <div class="space-y-6">
      <!-- Title & Toolbar -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">Bill of Materials (BOM)</h1>
          <p class="mt-1 text-sm text-slate-500">
            Daftar resep formulasi dan kebutuhan bahan baku untuk proses produksi.
          </p>
        </div>
        <div v-if="canCreate">
          <Button
            type="button"
            icon="pi pi-plus"
            label="Tambah BOM"
            severity="teal"
            class="bg-teal-600 text-white hover:bg-teal-700 w-full sm:w-auto"
            :disabled="isLoadingReferences"
            @click="openCreateDialog"
          />
        </div>
      </div>

      <!-- Messages Toast -->
      <Message v-if="errorMessage" severity="error" @close="errorMessage = ''">
        {{ errorMessage }}
      </Message>
      <Message v-if="referenceMessage" severity="warn" :closable="false">
        {{ referenceMessage }}
      </Message>
      <Message v-if="successMessage" severity="success" @close="successMessage = ''">
        {{ successMessage }}
      </Message>

      <!-- Search & Filters Toolbar -->
      <Toolbar
        class="border border-slate-100 bg-white/70 shadow-sm backdrop-blur-md rounded-xl p-4"
      >
        <template #start>
          <form class="flex flex-wrap items-center gap-3" @submit.prevent="applyFilters">
            <span class="relative w-full sm:w-72">
              <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <InputText
                v-model="searchQuery"
                placeholder="Cari kode atau nama resep..."
                class="!pl-10 w-full"
              />
            </span>

            <Select
              v-model="selectedActiveStatus"
              :options="activeOptions"
              option-label="label"
              option-value="value"
              placeholder="Status Aktif"
              class="w-full sm:w-44"
            />

            <div class="flex gap-2 w-full sm:w-auto">
              <Button
                type="submit"
                label="Filter"
                icon="pi pi-filter"
                severity="secondary"
                class="flex-1 sm:flex-initial"
              />
              <Button
                v-if="hasActiveFilters"
                type="button"
                icon="pi pi-filter-slash"
                severity="secondary"
                outlined
                aria-label="Reset Filter"
                class="flex-initial"
                @click="clearFilters"
              />
            </div>
          </form>
        </template>
      </Toolbar>

      <!-- Data Table -->
      <div class="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <DataTable
          v-model:expandedRows="expandedRows"
          :value="tableRows"
          data-key="id"
          :lazy="true"
          :paginator="true"
          :rows="perPage"
          :total-records="pagination?.total ?? 0"
          :first="((pagination?.current_page ?? 1) - 1) * perPage"
          :loading="isLoading"
          :sort-field="sortField"
          :sort-order="sortOrder"
          removable-sort
          showGridlines
          class="p-datatable-sm"
          paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          current-page-report-template="Menampilkan {first} sampai {last} dari {totalRecords} BOM"
          @page="handlePage"
          @sort="handleSort"
        >
          <!-- Row Expansion Column -->
          <Column expander style="width: 3rem" />

          <Column
            field="code"
            header="Kode"
            align-header="center"
            header-class="text-center"
            sortable
          >
            <template #body="{ data }">
              <div v-if="data.__loading" class="py-1">
                <Skeleton width="6rem" height="1.2rem" />
              </div>
              <span v-else class="font-mono font-bold text-teal-800">{{ data.code }}</span>
            </template>
          </Column>

          <Column
            field="name"
            header="Nama Resep"
            align-header="center"
            header-class="text-center"
            sortable
          >
            <template #body="{ data }">
              <div v-if="data.__loading" class="py-1">
                <Skeleton width="12rem" height="1.2rem" />
              </div>
              <div v-else>
                <div class="font-semibold text-slate-800">{{ data.name }}</div>
                <div v-if="data.description" class="text-xs text-slate-500 truncate max-w-xs">
                  {{ data.description }}
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="product_id"
            header="Produk Induk (Output)"
            align-header="center"
            header-class="text-center"
          >
            <template #body="{ data }">
              <div v-if="data.__loading" class="py-1">
                <Skeleton width="10rem" height="1.2rem" />
              </div>
              <div v-else-if="data.product">
                <div class="font-medium text-slate-700">{{ data.product.name }}</div>
                <div class="text-xs font-mono text-slate-400">{{ data.product.sku }}</div>
              </div>
              <span v-else class="text-slate-400 font-italic text-sm">-</span>
            </template>
          </Column>

          <Column
            field="output_qty"
            header="Hasil Output"
            align-header="center"
            header-class="text-center"
            class="text-right"
          >
            <template #body="{ data }">
              <div v-if="data.__loading" class="py-1 flex justify-end">
                <Skeleton width="4rem" height="1.2rem" />
              </div>
              <div v-else class="font-semibold">
                {{ Number(data.output_qty) }}
                <span class="text-xs font-normal text-slate-500">
                  {{ data.product?.unit?.code || 'pcs' }}
                </span>
              </div>
            </template>
          </Column>

          <Column
            field="is_default"
            header="Default"
            align-header="center"
            header-class="text-center"
            class="text-center"
          >
            <template #body="{ data }">
              <div v-if="data.__loading" class="py-1 flex justify-center">
                <Skeleton width="3rem" height="1.2rem" />
              </div>
              <div
                v-else-if="data.is_default"
                class="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20"
              >
                <i class="pi pi-check-circle text-xs"></i> Utama
              </div>
              <span v-else class="text-xs text-slate-400 font-medium">-</span>
            </template>
          </Column>

          <Column
            field="is_active"
            header="Status"
            align-header="center"
            header-class="text-center"
            class="text-center"
          >
            <template #body="{ data }">
              <div v-if="data.__loading" class="py-1 flex justify-center">
                <Skeleton width="4rem" height="1.2rem" />
              </div>
              <ActiveStatusTag v-else :active="data.is_active" />
            </template>
          </Column>

          <Column
            v-if="canManage"
            header="Aksi"
            align-header="center"
            header-class="text-center"
            class="text-center"
            style="width: 12rem"
          >
            <template #body="{ data }">
              <div v-if="data.__loading" class="py-1 flex justify-center gap-2">
                <Skeleton height="2rem" width="4rem" />
                <Skeleton height="2rem" width="4.5rem" />
              </div>
              <div v-else class="flex justify-center gap-2">
                <Button
                  v-if="canUpdate"
                  label="Edit"
                  icon="pi pi-pencil"
                  severity="info"
                  outlined
                  size="small"
                  @click="openEditDialog(data)"
                />
                <Button
                  v-if="canDelete"
                  label="Hapus"
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  size="small"
                  :loading="actionId === data.id"
                  :disabled="actionId === data.id"
                  @click="confirmDelete(data)"
                />
              </div>
            </template>
          </Column>

          <!-- Expanded Row Template: Details of BOM Items (Ingredients) -->
          <template #expansion="{ data }">
            <div class="p-4 bg-slate-50/50 rounded-lg border border-slate-100 m-2">
              <h4 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <i class="pi pi-info-circle text-teal-600"></i>
                Komposisi Bahan Baku (BOM Items) untuk {{ data.name }}
              </h4>

              <div
                v-if="!data.items || data.items.length === 0"
                class="text-sm text-slate-500 py-2"
              >
                Resep ini tidak memiliki bahan baku yang terdaftar.
              </div>

              <div
                v-else
                class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm"
              >
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr
                      class="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200"
                    >
                      <th class="px-4 py-2">No</th>
                      <th class="px-4 py-2">SKU</th>
                      <th class="px-4 py-2">Nama Material</th>
                      <th class="px-4 py-2 text-right">Qty Dibutuhkan</th>
                      <th class="px-4 py-2">Satuan</th>
                      <th class="px-4 py-2">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, idx) in data.items"
                      :key="item.id || idx"
                      class="border-b border-slate-100 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <td class="px-4 py-2.5 text-slate-400 font-semibold">
                        {{ Number(idx) + 1 }}
                      </td>
                      <td class="px-4 py-2.5 font-mono text-xs font-bold text-slate-600">
                        {{ item.material?.sku || '-' }}
                      </td>
                      <td class="px-4 py-2.5 font-medium text-slate-800">
                        {{ item.material?.name || `Material ID: ${item.material_id}` }}
                      </td>
                      <td class="px-4 py-2.5 text-right font-semibold text-teal-700">
                        {{ Number(item.qty_needed) }}
                      </td>
                      <td class="px-4 py-2.5 text-slate-600">
                        {{ item.unit?.name || item.material?.unit?.name || 'pcs' }}
                      </td>
                      <td class="px-4 py-2.5 text-xs text-slate-500 italic">
                        {{ item.notes || '-' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Confirm Dialog for Deletions -->
    <ConfirmDialog />

    <!-- Form Dialog for Creation and Updates -->
    <BomFormDialog
      v-model:visible="formDialogVisible"
      :mode="formMode"
      :bom="selectedBom"
      :products="products"
      :units="units"
      :submitting="isSubmitting"
      :errors="validationErrors"
      :message="formErrorMessage"
      @submit="handleFormSubmit"
    />
  </DashboardLayout>
</template>

<style scoped>
:deep(.p-datatable-column-header-content),
:deep(.p-column-header-content) {
  justify-content: center;
}
</style>
