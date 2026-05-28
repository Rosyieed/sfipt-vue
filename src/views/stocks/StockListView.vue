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
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ProductTypeTag from '@/components/products/ProductTypeTag.vue'
import StockDetailDialog from '@/components/stocks/StockDetailDialog.vue'
import StockScanDialog from '@/components/stocks/StockScanDialog.vue'
import WarehouseTypeTag from '@/components/warehouses/WarehouseTypeTag.vue'
import { ApiError } from '@/services/apiClient'
import * as productService from '@/services/productService'
import * as stockService from '@/services/stockService'
import * as warehouseService from '@/services/warehouseService'
import { useAuthStore } from '@/stores/auth'
import type { PaginatedData, SortDirection } from '@/types/api'
import type { Product } from '@/types/product'
import type { Stock, StockSortField } from '@/types/stock'
import type { Warehouse } from '@/types/warehouse'

type StockLoadingRow = {
  id: string
  __loading: true
}

type StockTableRow = Stock | StockLoadingRow

type FilterOption<T> = {
  label: string
  value: T
}

const authStore = useAuthStore()
const router = useRouter()

const stocks = ref<Stock[]>([])
const products = ref<Product[]>([])
const warehouses = ref<Warehouse[]>([])
const pagination = ref<PaginatedData<Stock> | null>(null)
const isLoading = ref(false)
const isLoadingReferences = ref(false)
const errorMessage = ref('')
const referenceMessage = ref('')
const detailMessage = ref('')
const currentPage = ref(1)
const perPage = 10
const searchQuery = ref('')
const activeSearch = ref('')
const selectedProductId = ref<number | null>(null)
const activeProductId = ref<number | null>(null)
const selectedWarehouseId = ref<number | null>(null)
const activeWarehouseId = ref<number | null>(null)
const selectedLowStock = ref<boolean | null>(null)
const activeLowStock = ref<boolean | null>(null)
const sortField = ref<StockSortField>('product_id')
const sortDirection = ref<SortDirection>('asc')
const sortOrder = ref<1 | -1>(1)
const scanDialogVisible = ref(false)
const selectedStock = ref<Stock | null>(null)
const detailDialogVisible = ref(false)
const isLoadingDetail = ref(false)

const hasActiveFilters = computed(() =>
  Boolean(activeSearch.value || activeProductId.value || activeWarehouseId.value || activeLowStock.value !== null),
)
const tableRows = computed<StockTableRow[]>(() => {
  if (isLoading.value) {
    return Array.from({ length: perPage }, (_, index) => ({
      id: `loading-${index}`,
      __loading: true,
    }))
  }

  return stocks.value
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

const lowStockOptions: Array<FilterOption<boolean | null>> = [
  { label: 'Semua stok', value: null },
  { label: 'Stok rendah', value: true },
  { label: 'Stok aman', value: false },
]

onMounted(() => {
  void loadInitialData()
})

async function loadInitialData() {
  await Promise.all([loadReferences(), loadStocks()])
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

    referenceMessage.value = 'Referensi produk dan gudang belum bisa dimuat. Filter stok mungkin belum lengkap.'
  } finally {
    isLoadingReferences.value = false
  }
}

async function loadStocks(page = currentPage.value) {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await stockService.getStocks(authStore.token, {
      page,
      perPage,
      sort: sortField.value,
      direction: sortDirection.value,
      search: activeSearch.value,
      productId: activeProductId.value,
      warehouseId: activeWarehouseId.value,
      lowStock: activeLowStock.value,
    })
    stocks.value = result.data
    pagination.value = result
    currentPage.value = result.current_page
  } catch (error) {
    await handleApiError(error)
  } finally {
    isLoading.value = false
  }
}

function handlePage(event: { page?: number }) {
  void loadStocks((event.page ?? 0) + 1)
}

function applyFilters() {
  activeSearch.value = searchQuery.value.trim()
  activeProductId.value = selectedProductId.value
  activeWarehouseId.value = selectedWarehouseId.value
  activeLowStock.value = selectedLowStock.value
  void loadStocks(1)
}

function clearFilters() {
  searchQuery.value = ''
  activeSearch.value = ''
  selectedProductId.value = null
  activeProductId.value = null
  selectedWarehouseId.value = null
  activeWarehouseId.value = null
  selectedLowStock.value = null
  activeLowStock.value = null
  void loadStocks(1)
}

function handleSort(event: { sortField?: string | ((item: Stock) => unknown); sortOrder?: number | null }) {
  if (typeof event.sortField !== 'string' || !isStockSortField(event.sortField)) {
    return
  }

  sortField.value = event.sortField
  sortOrder.value = event.sortOrder === -1 ? -1 : 1
  sortDirection.value = sortOrder.value === -1 ? 'desc' : 'asc'
  void loadStocks(1)
}

async function openDetailDialog(stock: Stock) {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  selectedStock.value = stock
  detailMessage.value = ''
  detailDialogVisible.value = true
  isLoadingDetail.value = true

  try {
    selectedStock.value = await stockService.getStock(authStore.token, stock.id)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      authStore.clearSession()
      await router.push('/login')
      return
    }

    detailMessage.value = error instanceof ApiError ? error.message : 'Detail stok belum bisa dimuat.'
  } finally {
    isLoadingDetail.value = false
  }
}

function closeDetailDialog() {
  detailDialogVisible.value = false
  selectedStock.value = null
  detailMessage.value = ''
}

function openScanDialog() {
  scanDialogVisible.value = true
}

async function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      authStore.clearSession()
      await router.push('/login')
      return
    }

    if (error.status === 403) {
      errorMessage.value = 'Anda tidak memiliki akses untuk melihat data stok.'
      return
    }

    errorMessage.value = error.message
    return
  }

  errorMessage.value = 'Data stok belum bisa dimuat. Silakan coba lagi.'
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

function formatQty(value: string | number | undefined) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(Number(value ?? 0))
}

function getProductName(stock: Stock) {
  return stock.product?.name ?? `Produk #${stock.product_id}`
}

function getProductCode(stock: Stock) {
  return stock.product?.sku ?? '-'
}

function getProductBarcode(stock: Stock) {
  return stock.product?.barcode ?? '-'
}

function getUnitName(stock: Stock) {
  return stock.product?.unit?.name ?? ''
}

function getWarehouseName(stock: Stock) {
  return stock.warehouse?.name ?? `Gudang #${stock.warehouse_id}`
}

function getWarehouseCode(stock: Stock) {
  return stock.warehouse?.code ?? '-'
}

function getWarehouseType(stock: Stock) {
  return stock.warehouse?.type ?? null
}

function isLowStock(stock: Stock) {
  if (typeof stock.is_low_stock === 'boolean') {
    return stock.is_low_stock
  }

  return Number(stock.qty) < Number(stock.product?.min_stock ?? 0)
}

function isStockSortField(value: string): value is StockSortField {
  return ['id', 'product_id', 'warehouse_id', 'qty', 'created_at'].includes(value)
}

function isLoadingRow(row: StockTableRow): row is StockLoadingRow {
  return '__loading' in row
}

function getStockRowClass(row: StockTableRow) {
  if (isLoadingRow(row)) {
    return ''
  }

  return isLowStock(row) ? 'stock-row--low' : ''
}
</script>

<template>
  <DashboardLayout>
    <section class="app-page">
      <div class="app-page-header">
        <div>
          <p class="app-eyebrow">Inventory</p>
          <h2 class="app-page-title">Stok</h2>
          <p class="app-page-description">
            Pantau jumlah stok berjalan per produk dan gudang, termasuk indikator stok rendah.
          </p>
        </div>

        <Button label="Scan Stok" icon="pi pi-barcode" severity="secondary" outlined @click="openScanDialog" />
      </div>

      <Message v-if="errorMessage" class="mb-4" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>
      <Message v-if="referenceMessage" class="mb-4" severity="warn" :closable="false">
        {{ referenceMessage }}
      </Message>

      <div class="app-data-panel">
        <Toolbar>
          <template #start>
            <div>
              <h3 class="text-base font-semibold text-slate-950">Daftar Stok</h3>
              <p class="mt-1 text-sm text-slate-500">{{ pagination?.total ?? 0 }} baris stok</p>
            </div>
          </template>
        </Toolbar>

        <div class="stock-filter-panel">
          <div class="stock-filter-panel__header">
            <div class="flex items-center gap-3">
              <span class="stock-filter-panel__icon">
                <i class="pi pi-filter"></i>
              </span>
              <div>
                <h4 class="text-sm font-extrabold text-slate-950">Filter Stok</h4>
                <p class="mt-1 text-xs font-medium text-slate-500">
                  SKU, barcode, produk, gudang, dan status stok rendah
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

          <div class="stock-filter-grid">
            <div class="stock-filter-field stock-filter-field--wide">
              <label for="stock-search" class="stock-filter-label">
                <i class="pi pi-search"></i>
                Pencarian
              </label>
              <InputText
                id="stock-search"
                v-model="searchQuery"
                class="w-full"
                placeholder="SKU, barcode, produk, atau gudang"
                :disabled="isLoading"
                @keydown.enter.prevent="applyFilters"
              />
            </div>

            <div class="stock-filter-field">
              <label for="stock-product-filter" class="stock-filter-label">
                <i class="pi pi-box"></i>
                Produk
              </label>
              <Select
                id="stock-product-filter"
                v-model="selectedProductId"
                class="w-full"
                :options="productOptions"
                option-label="label"
                option-value="value"
                filter
                :disabled="isLoading || isLoadingReferences"
              />
            </div>

            <div class="stock-filter-field">
              <label for="stock-warehouse-filter" class="stock-filter-label">
                <i class="pi pi-warehouse"></i>
                Gudang
              </label>
              <Select
                id="stock-warehouse-filter"
                v-model="selectedWarehouseId"
                class="w-full"
                :options="warehouseOptions"
                option-label="label"
                option-value="value"
                filter
                :disabled="isLoading || isLoadingReferences"
              />
            </div>

            <div class="stock-filter-field">
              <label for="stock-low-filter" class="stock-filter-label">
                <i class="pi pi-exclamation-circle"></i>
                Status
              </label>
              <Select
                id="stock-low-filter"
                v-model="selectedLowStock"
                class="w-full"
                :options="lowStockOptions"
                option-label="label"
                option-value="value"
                :disabled="isLoading"
              />
            </div>

            <div class="stock-filter-actions">
              <Button label="Terapkan" icon="pi pi-search" :disabled="isLoading" @click="applyFilters" />
              <Button label="Reset" icon="pi pi-times" severity="secondary" outlined :disabled="isLoading" @click="clearFilters" />
              <Button
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                rounded
                aria-label="Muat ulang data stok"
                title="Muat ulang data stok"
                :disabled="isLoading"
                @click="loadStocks()"
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
          :row-class="getStockRowClass"
          showGridlines
          row-hover
          responsive-layout="scroll"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          current-page-report-template="Menampilkan {first} sampai {last} dari {totalRecords} stok"
          @page="handlePage"
          @sort="handleSort"
        >
          <template #empty>
            <div class="app-empty-state">Belum ada data stok.</div>
          </template>

          <Column field="product_id" header="Produk" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="13rem" />
              <div v-else>
                <p class="font-semibold text-slate-950">{{ getProductName(data) }}</p>
                <p class="mt-1 text-xs font-semibold text-slate-500">
                  <span class="font-mono">{{ getProductCode(data) }}</span>
                  <span class="mx-1">-</span>
                  <span>{{ getProductBarcode(data) }}</span>
                </p>
                <div v-if="data.product" class="mt-2">
                  <ProductTypeTag :type="data.product.type" />
                </div>
              </div>
            </template>
          </Column>
          <Column field="warehouse_id" header="Gudang" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="11rem" />
              <div v-else>
                <p class="font-semibold text-slate-950">{{ getWarehouseName(data) }}</p>
                <p class="mt-1 font-mono text-xs font-semibold text-slate-500">
                  {{ getWarehouseCode(data) }}
                </p>
                <div v-if="getWarehouseType(data)" class="mt-2">
                  <WarehouseTypeTag :type="getWarehouseType(data)!" />
                </div>
              </div>
            </template>
          </Column>
          <Column field="qty" header="Stok" header-class="text-center" body-class="text-right" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="5rem" />
              <div v-else>
                <p
                  class="text-xl font-extrabold"
                  :class="isLowStock(data) ? 'text-red-700' : 'text-slate-950'"
                >
                  {{ formatQty(data.qty) }}
                  <span v-if="getUnitName(data)" class="text-sm font-bold text-slate-500">
                    {{ getUnitName(data) }}
                  </span>
                </p>
                <p class="mt-1 text-xs font-semibold text-slate-500">
                  Min. {{ formatQty(data.product?.min_stock) }}
                  <span v-if="getUnitName(data)">{{ getUnitName(data) }}</span>
                </p>
              </div>
            </template>
          </Column>
          <Column header="Status" header-class="text-center">
            <template #body="{ data }">
              <div class="flex justify-center">
                <Skeleton v-if="isLoadingRow(data)" height="1.5rem" width="6rem" border-radius="999px" />
                <Tag v-else :value="isLowStock(data) ? 'Stok rendah' : 'Aman'" :severity="isLowStock(data) ? 'danger' : 'success'" />
              </div>
            </template>
          </Column>
          <Column field="created_at" header="Update Terakhir" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="8rem" />
              <span v-else class="text-slate-600">{{ formatDate(data.updated_at ?? data.created_at) }}</span>
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

      <StockDetailDialog
        :visible="detailDialogVisible"
        :stock="selectedStock"
        :loading="isLoadingDetail"
        :message="detailMessage"
        @update:visible="($event) => (!$event ? closeDetailDialog() : (detailDialogVisible = true))"
      />

      <StockScanDialog v-model:visible="scanDialogVisible" />
    </section>
  </DashboardLayout>
</template>

<style scoped>
.stock-filter-panel {
  border-bottom: 1px solid var(--sf-border);
  background:
    linear-gradient(180deg, rgba(240, 253, 250, 0.72), rgba(255, 255, 255, 0.84)),
    linear-gradient(135deg, rgba(14, 165, 233, 0.08), transparent 42%);
  padding: 1rem;
}

.stock-filter-panel__header {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.stock-filter-panel__icon {
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

.stock-filter-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
}

.stock-filter-field {
  min-width: 0;
}

.stock-filter-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.45rem;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 800;
}

.stock-filter-label i {
  color: var(--sf-primary);
  font-size: 0.85rem;
}

.stock-filter-actions {
  display: flex;
  align-items: end;
  gap: 0.55rem;
}

:deep(.p-datatable-column-header-content),
:deep(.p-column-header-content) {
  justify-content: center;
}

:deep(.stock-row--low > td) {
  background: rgba(254, 242, 242, 0.92);
}

:deep(.stock-row--low > td:first-child) {
  box-shadow: inset 4px 0 0 #dc2626;
}

:deep(.stock-row--low:hover > td) {
  background: rgba(254, 226, 226, 0.95);
}

@media (min-width: 640px) {
  .stock-filter-panel__header {
    flex-direction: row;
    align-items: center;
  }

  .stock-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stock-filter-field--wide,
  .stock-filter-actions {
    grid-column: span 2;
  }
}

@media (min-width: 1280px) {
  .stock-filter-grid {
    grid-template-columns: minmax(16rem, 1.4fr) repeat(3, minmax(10rem, 1fr)) auto;
    align-items: end;
  }

  .stock-filter-field--wide,
  .stock-filter-actions {
    grid-column: auto;
  }
}
</style>
