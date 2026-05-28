<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import Toolbar from 'primevue/toolbar'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import MutationDetailDialog from '@/components/mutations/MutationDetailDialog.vue'
import MutationFormDialog from '@/components/mutations/MutationFormDialog.vue'
import MutationTypeTag from '@/components/mutations/MutationTypeTag.vue'
import { ApiError } from '@/services/apiClient'
import * as productService from '@/services/productService'
import * as stockMutationService from '@/services/stockMutationService'
import * as warehouseService from '@/services/warehouseService'
import { useAuthStore } from '@/stores/auth'
import type { PaginatedData, SortDirection } from '@/types/api'
import type { ApiValidationErrors } from '@/types/auth'
import type { Product } from '@/types/product'
import type {
  StockMutation,
  StockMutationListParams,
  StockMutationPayload,
  StockMutationSortField,
  StockMutationType,
} from '@/types/stockMutation'
import type { Warehouse } from '@/types/warehouse'

type MutationLoadingRow = {
  id: string
  __loading: true
}

type MutationTableRow = StockMutation | MutationLoadingRow

type FilterOption<T> = {
  label: string
  value: T
}

const authStore = useAuthStore()
const router = useRouter()

const mutations = ref<StockMutation[]>([])
const products = ref<Product[]>([])
const warehouses = ref<Warehouse[]>([])
const pagination = ref<PaginatedData<StockMutation> | null>(null)
const isLoading = ref(false)
const isLoadingReferences = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const referenceMessage = ref('')
const formErrorMessage = ref('')
const detailMessage = ref('')
const validationErrors = ref<ApiValidationErrors>({})
const formDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const selectedMutation = ref<StockMutation | null>(null)
const isLoadingDetail = ref(false)
const currentPage = ref(1)
const perPage = 10
const searchQuery = ref('')
const activeSearch = ref('')
const selectedProductId = ref<number | null>(null)
const activeProductId = ref<number | null>(null)
const selectedWarehouseId = ref<number | null>(null)
const activeWarehouseId = ref<number | null>(null)
const selectedType = ref<StockMutationType | null>(null)
const activeType = ref<StockMutationType | null>(null)
const sortField = ref<StockMutationSortField>('created_at')
const sortDirection = ref<SortDirection>('desc')
const sortOrder = ref<1 | -1>(-1)

const canCreate = computed(() => authStore.hasPermission('mutations.create'))
const hasActiveFilters = computed(() =>
  Boolean(activeSearch.value || activeProductId.value || activeWarehouseId.value || activeType.value),
)
const tableRows = computed<MutationTableRow[]>(() => {
  if (isLoading.value) {
    return Array.from({ length: perPage }, (_, index) => ({
      id: `loading-${index}`,
      __loading: true,
    }))
  }

  return mutations.value
})

const productOptions = computed<Array<FilterOption<number | null>>>(() => [
  { label: 'Semua produk', value: null },
  ...products.value.map((product) => ({
    label: `${product.sku} - ${product.name}`,
    value: product.id,
  })),
])

const warehouseOptions = computed<Array<FilterOption<number | null>>>(() => [
  { label: 'Semua gudang', value: null },
  ...warehouses.value.map((warehouse) => ({
    label: `${warehouse.code} - ${warehouse.name}`,
    value: warehouse.id,
  })),
])

const typeOptions: Array<FilterOption<StockMutationType | null>> = [
  { label: 'Semua tipe', value: null },
  { label: 'Stok Masuk', value: 'in' },
  { label: 'Stok Keluar', value: 'out' },
  { label: 'Transfer', value: 'transfer' },
  { label: 'Adjustment', value: 'adjustment' },
]

onMounted(() => {
  void loadInitialData()
})

async function loadInitialData() {
  await Promise.all([loadReferences(), loadMutations()])
}

async function loadReferences() {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isLoadingReferences.value = true
  referenceMessage.value = ''

  try {
    const [productResult, warehouseResult] = await Promise.all([
      productService.getProducts(authStore.token, {
        page: 1,
        perPage: 100,
        sort: 'name',
        direction: 'asc',
      }),
      warehouseService.getWarehouses(authStore.token, {
        page: 1,
        perPage: 100,
        sort: 'name',
        direction: 'asc',
      }),
    ])

    products.value = productResult.data
    warehouses.value = warehouseResult.data
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      authStore.clearSession()
      await router.push('/login')
      return
    }

    referenceMessage.value = 'Referensi produk dan gudang belum bisa dimuat. Form mutasi mungkin belum lengkap.'
  } finally {
    isLoadingReferences.value = false
  }
}

async function loadMutations(page = currentPage.value) {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const params: StockMutationListParams = {
      page,
      perPage,
      sort: sortField.value,
      direction: sortDirection.value,
      search: activeSearch.value,
      productId: activeProductId.value,
      warehouseId: activeWarehouseId.value,
      type: activeType.value,
    }
    const result = await stockMutationService.getStockMutations(authStore.token, params)
    mutations.value = result.data
    pagination.value = result
    currentPage.value = result.current_page
  } catch (error) {
    await handleApiError(error)
  } finally {
    isLoading.value = false
  }
}

function handlePage(event: { page?: number }) {
  void loadMutations((event.page ?? 0) + 1)
}

function applyFilters() {
  activeSearch.value = searchQuery.value.trim()
  activeProductId.value = selectedProductId.value
  activeWarehouseId.value = selectedWarehouseId.value
  activeType.value = selectedType.value
  void loadMutations(1)
}

function clearFilters() {
  searchQuery.value = ''
  activeSearch.value = ''
  selectedProductId.value = null
  activeProductId.value = null
  selectedWarehouseId.value = null
  activeWarehouseId.value = null
  selectedType.value = null
  activeType.value = null
  void loadMutations(1)
}

function handleSort(event: { sortField?: string | ((item: StockMutation) => unknown); sortOrder?: number | null }) {
  if (typeof event.sortField !== 'string' || !isMutationSortField(event.sortField)) {
    return
  }

  sortField.value = event.sortField
  sortOrder.value = event.sortOrder === -1 ? -1 : 1
  sortDirection.value = sortOrder.value === -1 ? 'desc' : 'asc'
  void loadMutations(1)
}

function openCreateDialog() {
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

async function saveMutation(payload: StockMutationPayload) {
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
    await stockMutationService.createStockMutation(authStore.token, payload)
    successMessage.value = 'Mutasi stok berhasil disimpan.'
    formDialogVisible.value = false
    await loadMutations(1)
  } catch (error) {
    await handleApiError(error, 'form')
  } finally {
    isSubmitting.value = false
  }
}

async function openDetailDialog(mutation: StockMutation) {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  selectedMutation.value = mutation
  detailMessage.value = ''
  detailDialogVisible.value = true
  isLoadingDetail.value = true

  try {
    selectedMutation.value = await stockMutationService.getStockMutation(authStore.token, mutation.id)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      authStore.clearSession()
      await router.push('/login')
      return
    }

    detailMessage.value = error instanceof ApiError ? error.message : 'Detail mutasi belum bisa dimuat.'
  } finally {
    isLoadingDetail.value = false
  }
}

function closeDetailDialog() {
  detailDialogVisible.value = false
  selectedMutation.value = null
  detailMessage.value = ''
}

async function handleApiError(error: unknown, target: 'page' | 'form' = 'page') {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      authStore.clearSession()
      await router.push('/login')
      return
    }

    if (error.status === 403) {
      const message = 'Anda tidak memiliki akses untuk mengelola mutasi stok.'
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

  const message = 'Data mutasi belum bisa diproses. Silakan coba lagi.'
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

function formatQty(value: string | number) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(Number(value))
}

function formatNullable(value: string | null | undefined) {
  return value?.trim() || '-'
}

function getProductName(mutation: StockMutation) {
  return mutation.product ? `${mutation.product.sku} - ${mutation.product.name}` : `Produk #${mutation.product_id}`
}

function getWarehouseName(value?: Warehouse | null, id?: number | null) {
  if (value) {
    return `${value.code} - ${value.name}`
  }

  return id ? `Gudang #${id}` : '-'
}

function isMutationSortField(value: string): value is StockMutationSortField {
  return ['id', 'product_id', 'type', 'qty', 'created_at'].includes(value)
}

function isLoadingRow(row: MutationTableRow): row is MutationLoadingRow {
  return '__loading' in row
}
</script>

<template>
  <DashboardLayout>
    <section class="app-page">
      <div class="app-page-header">
        <div>
          <p class="app-eyebrow">Inventory</p>
          <h2 class="app-page-title">Mutasi</h2>
          <p class="app-page-description">
            Catat stok masuk, keluar, transfer, dan adjustment sebagai audit trail inventory.
          </p>
        </div>

        <Button
          v-if="canCreate"
          label="Tambah Mutasi"
          icon="pi pi-plus"
          :disabled="isLoadingReferences"
          @click="openCreateDialog"
        />
      </div>

      <Message v-if="errorMessage" class="mb-4" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>
      <Message v-if="referenceMessage" class="mb-4" severity="warn" :closable="false">
        {{ referenceMessage }}
      </Message>
      <Message v-if="successMessage" class="mb-4" severity="success" :closable="false">
        {{ successMessage }}
      </Message>

      <div class="app-data-panel">
        <Toolbar>
          <template #start>
            <div>
              <h3 class="text-base font-semibold text-slate-950">Audit Mutasi</h3>
              <p class="mt-1 text-sm text-slate-500">{{ pagination?.total ?? 0 }} mutasi tercatat</p>
            </div>
          </template>
        </Toolbar>

        <div class="mutation-filter-panel">
          <div class="mutation-filter-panel__header">
            <div class="flex items-center gap-3">
              <span class="mutation-filter-panel__icon">
                <i class="pi pi-filter"></i>
              </span>
              <div>
                <h4 class="text-sm font-extrabold text-slate-950">Filter Mutasi</h4>
                <p class="mt-1 text-xs font-medium text-slate-500">
                  Produk, gudang, tipe, reference no, dan catatan
                </p>
              </div>
            </div>

            <span
              v-if="hasActiveFilters"
              class="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700"
            >
              Filter aktif
            </span>
          </div>

          <div class="mutation-filter-grid">
            <div class="mutation-filter-field mutation-filter-field--wide">
              <label for="mutation-search" class="mutation-filter-label">
                <i class="pi pi-search"></i>
                Pencarian
              </label>
              <InputText
                id="mutation-search"
                v-model="searchQuery"
                class="w-full"
                placeholder="Produk, gudang, reference no, atau catatan"
                :disabled="isLoading"
                @keydown.enter.prevent="applyFilters"
              />
            </div>

            <div class="mutation-filter-field">
              <label for="mutation-product-filter" class="mutation-filter-label">
                <i class="pi pi-box"></i>
                Produk
              </label>
              <Select
                id="mutation-product-filter"
                v-model="selectedProductId"
                class="w-full"
                :options="productOptions"
                option-label="label"
                option-value="value"
                filter
                :disabled="isLoading || isLoadingReferences"
              />
            </div>

            <div class="mutation-filter-field">
              <label for="mutation-warehouse-filter" class="mutation-filter-label">
                <i class="pi pi-warehouse"></i>
                Gudang
              </label>
              <Select
                id="mutation-warehouse-filter"
                v-model="selectedWarehouseId"
                class="w-full"
                :options="warehouseOptions"
                option-label="label"
                option-value="value"
                filter
                :disabled="isLoading || isLoadingReferences"
              />
            </div>

            <div class="mutation-filter-field">
              <label for="mutation-type-filter" class="mutation-filter-label">
                <i class="pi pi-arrow-right-arrow-left"></i>
                Tipe
              </label>
              <Select
                id="mutation-type-filter"
                v-model="selectedType"
                class="w-full"
                :options="typeOptions"
                option-label="label"
                option-value="value"
                :disabled="isLoading"
              />
            </div>

            <div class="mutation-filter-actions">
              <Button label="Terapkan" icon="pi pi-search" :disabled="isLoading" @click="applyFilters" />
              <Button label="Reset" icon="pi pi-times" severity="secondary" outlined :disabled="isLoading" @click="clearFilters" />
              <Button
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                rounded
                aria-label="Muat ulang data mutasi"
                title="Muat ulang data mutasi"
                :disabled="isLoading"
                @click="loadMutations()"
              />
            </div>
          </div>
        </div>

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
          current-page-report-template="Menampilkan {first} sampai {last} dari {totalRecords} mutasi"
          @page="handlePage"
          @sort="handleSort"
        >
          <template #empty>
            <div class="app-empty-state">Belum ada data mutasi.</div>
          </template>

          <Column field="created_at" header="Tanggal" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="8rem" />
              <span v-else class="text-slate-600">{{ formatDate(data.created_at) }}</span>
            </template>
          </Column>
          <Column field="product_id" header="Produk" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="13rem" />
              <span v-else class="font-semibold text-slate-950">{{ getProductName(data) }}</span>
            </template>
          </Column>
          <Column field="type" header="Tipe" header-class="text-center" sortable>
            <template #body="{ data }">
              <div class="flex justify-center">
                <Skeleton v-if="isLoadingRow(data)" height="1.5rem" width="6rem" border-radius="999px" />
                <MutationTypeTag v-else :type="data.type" />
              </div>
            </template>
          </Column>
          <Column header="Gudang Asal" header-class="text-center">
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="10rem" />
              <span v-else class="text-slate-600">{{ getWarehouseName(data.from_warehouse, data.from_warehouse_id) }}</span>
            </template>
          </Column>
          <Column header="Gudang Tujuan" header-class="text-center">
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="10rem" />
              <span v-else class="text-slate-600">{{ getWarehouseName(data.to_warehouse, data.to_warehouse_id) }}</span>
            </template>
          </Column>
          <Column field="qty" header="Qty" header-class="text-center" body-class="text-right" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="5rem" />
              <span v-else class="font-extrabold text-slate-950">{{ formatQty(data.qty) }}</span>
            </template>
          </Column>
          <Column header="Referensi" header-class="text-center">
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="8rem" />
              <span v-else class="text-slate-600">{{ formatNullable(data.reference_no) }}</span>
            </template>
          </Column>
          <Column header="Catatan" header-class="text-center">
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="10rem" />
              <span v-else class="text-slate-600">{{ formatNullable(data.notes) }}</span>
            </template>
          </Column>
          <Column header="Aksi" header-class="text-center" body-class="text-center">
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="2rem" width="4.5rem" />
              <Button
                v-else
                label="Detail"
                icon="pi pi-eye"
                severity="secondary"
                outlined
                size="small"
                @click="openDetailDialog(data)"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <MutationDetailDialog
        :visible="detailDialogVisible"
        :mutation="selectedMutation"
        :loading="isLoadingDetail"
        :message="detailMessage"
        @update:visible="($event) => (!$event ? closeDetailDialog() : (detailDialogVisible = true))"
      />

      <MutationFormDialog
        v-model:visible="formDialogVisible"
        :products="products"
        :warehouses="warehouses"
        :submitting="isSubmitting"
        :errors="validationErrors"
        :message="formErrorMessage"
        @submit="saveMutation"
      />
    </section>
  </DashboardLayout>
</template>

<style scoped>
.mutation-filter-panel {
  border-bottom: 1px solid var(--sf-border);
  background:
    linear-gradient(180deg, rgba(240, 253, 250, 0.72), rgba(255, 255, 255, 0.84)),
    linear-gradient(135deg, rgba(14, 165, 233, 0.08), transparent 42%);
  padding: 1rem;
}

.mutation-filter-panel__header {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.mutation-filter-panel__icon {
  display: grid;
  place-items: center;
  width: 2.35rem;
  height: 2.35rem;
  flex: 0 0 auto;
  border: 1px solid rgba(15, 118, 110, 0.18);
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.82);
  color: var(--sf-primary);
  box-shadow: 0 8px 18px rgba(15, 118, 110, 0.08);
}

.mutation-filter-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
}

.mutation-filter-field {
  min-width: 0;
}

.mutation-filter-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.45rem;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 800;
}

.mutation-filter-label i {
  color: var(--sf-primary);
  font-size: 0.85rem;
}

.mutation-filter-actions {
  display: flex;
  align-items: end;
  gap: 0.55rem;
}

:deep(.p-datatable-column-header-content),
:deep(.p-column-header-content) {
  justify-content: center;
}

@media (min-width: 640px) {
  .mutation-filter-panel__header {
    flex-direction: row;
    align-items: center;
  }

  .mutation-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mutation-filter-field--wide,
  .mutation-filter-actions {
    grid-column: span 2;
  }
}

@media (min-width: 1280px) {
  .mutation-filter-grid {
    grid-template-columns: minmax(16rem, 1.4fr) repeat(3, minmax(10rem, 1fr)) auto;
    align-items: end;
  }

  .mutation-filter-field--wide,
  .mutation-filter-actions {
    grid-column: auto;
  }
}
</style>
