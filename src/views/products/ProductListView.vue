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
import ProductBarcodeDialog from '@/components/products/ProductBarcodeDialog.vue'
import ProductFormDialog from '@/components/products/ProductFormDialog.vue'
import ProductTypeTag from '@/components/products/ProductTypeTag.vue'
import ActiveStatusTag from '@/components/common/ActiveStatusTag.vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { ApiError } from '@/services/apiClient'
import * as categoryService from '@/services/categoryService'
import * as productService from '@/services/productService'
import * as unitService from '@/services/unitService'
import { useAuthStore } from '@/stores/auth'
import type { PaginatedData, SortDirection } from '@/types/api'
import type { ApiValidationErrors } from '@/types/auth'
import type { Category } from '@/types/category'
import type { Product, ProductPayload, ProductSortField, ProductType } from '@/types/product'
import type { Unit } from '@/types/unit'

type ProductLoadingRow = {
  id: string
  __loading: true
}

type ProductTableRow = Product | ProductLoadingRow

type FilterOption<T> = {
  label: string
  value: T
}

const authStore = useAuthStore()
const router = useRouter()
const confirm = useConfirm()

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const units = ref<Unit[]>([])
const pagination = ref<PaginatedData<Product> | null>(null)
const isLoading = ref(false)
const isLoadingReferences = ref(false)
const actionId = ref<number | null>(null)
const errorMessage = ref('')
const referenceMessage = ref('')
const successMessage = ref('')
const formErrorMessage = ref('')
const validationErrors = ref<ApiValidationErrors>({})
const formMode = ref<'create' | 'edit'>('create')
const selectedProduct = ref<Product | null>(null)
const selectedBarcodeProduct = ref<Product | null>(null)
const barcodeDialogMode = ref<'scan' | 'generate'>('scan')
const formDialogVisible = ref(false)
const barcodeDialogVisible = ref(false)
const isSubmitting = ref(false)
const currentPage = ref(1)
const perPage = 10
const searchQuery = ref('')
const activeSearch = ref('')
const selectedType = ref<ProductType | null>(null)
const activeType = ref<ProductType | null>(null)
const selectedCategoryId = ref<number | null>(null)
const activeCategoryId = ref<number | null>(null)
const selectedUnitId = ref<number | null>(null)
const activeUnitId = ref<number | null>(null)
const selectedActiveStatus = ref<boolean | null>(null)
const activeStatus = ref<boolean | null>(null)
const sortField = ref<ProductSortField>('sku')
const sortDirection = ref<SortDirection>('asc')
const sortOrder = ref<1 | -1>(1)

const canCreate = computed(() => authStore.hasPermission('products.create'))
const canUpdate = computed(() => authStore.hasPermission('products.update'))
const canDelete = computed(() => authStore.hasPermission('products.delete'))
const canManage = computed(() => canUpdate.value || canDelete.value)
const hasActiveFilters = computed(() =>
  Boolean(
    activeSearch.value ||
      activeType.value ||
      activeCategoryId.value ||
      activeUnitId.value ||
      activeStatus.value !== null,
  ),
)
const tableRows = computed<ProductTableRow[]>(() => {
  if (isLoading.value) {
    return Array.from({ length: perPage }, (_, index) => ({
      id: `loading-${index}`,
      __loading: true,
    }))
  }

  return products.value
})

const typeOptions: Array<FilterOption<ProductType | null>> = [
  { label: 'Semua tipe', value: null },
  { label: 'Bahan Baku', value: 'raw_material' },
  { label: 'Barang Jadi', value: 'finished_good' },
  { label: 'Setengah Jadi', value: 'semi_finished' },
  { label: 'Kemasan', value: 'packaging' },
]

const activeOptions: Array<FilterOption<boolean | null>> = [
  { label: 'Semua status', value: null },
  { label: 'Aktif', value: true },
  { label: 'Nonaktif', value: false },
]

const categoryFilterOptions = computed<Array<FilterOption<number | null>>>(() => [
  { label: 'Semua kategori', value: null },
  ...categories.value.map((category) => ({
    label: category.name,
    value: category.id,
  })),
])

const unitFilterOptions = computed<Array<FilterOption<number | null>>>(() => [
  { label: 'Semua satuan', value: null },
  ...units.value.map((unit) => ({
    label: unit.name,
    value: unit.id,
  })),
])

onMounted(() => {
  void loadInitialData()
})

async function loadInitialData() {
  await Promise.all([loadReferences(), loadProducts()])
}

async function loadReferences() {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isLoadingReferences.value = true
  referenceMessage.value = ''

  try {
    const [categoryResult, unitResult] = await Promise.all([
      categoryService.getCategories(authStore.token, {
        page: 1,
        perPage: 100,
        sort: 'name',
        direction: 'asc',
      }),
      unitService.getUnits(authStore.token, {
        page: 1,
        perPage: 100,
        sort: 'name',
        direction: 'asc',
      }),
    ])

    categories.value = categoryResult.data
    units.value = unitResult.data
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      authStore.clearSession()
      await router.push('/login')
      return
    }

    referenceMessage.value =
      'Referensi kategori dan satuan belum bisa dimuat. Filter dan form produk mungkin belum lengkap.'
  } finally {
    isLoadingReferences.value = false
  }
}

async function loadProducts(page = currentPage.value) {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await productService.getProducts(authStore.token, {
      page,
      perPage,
      sort: sortField.value,
      direction: sortDirection.value,
      search: activeSearch.value,
      type: activeType.value,
      categoryId: activeCategoryId.value,
      unitId: activeUnitId.value,
      isActive: activeStatus.value,
    })
    products.value = result.data
    pagination.value = result
    currentPage.value = result.current_page
  } catch (error) {
    await handleApiError(error)
  } finally {
    isLoading.value = false
  }
}

function handlePage(event: { page?: number }) {
  void loadProducts((event.page ?? 0) + 1)
}

function applyFilters() {
  activeSearch.value = searchQuery.value.trim()
  activeType.value = selectedType.value
  activeCategoryId.value = selectedCategoryId.value
  activeUnitId.value = selectedUnitId.value
  activeStatus.value = selectedActiveStatus.value
  void loadProducts(1)
}

function clearFilters() {
  searchQuery.value = ''
  activeSearch.value = ''
  selectedType.value = null
  activeType.value = null
  selectedCategoryId.value = null
  activeCategoryId.value = null
  selectedUnitId.value = null
  activeUnitId.value = null
  selectedActiveStatus.value = null
  activeStatus.value = null
  void loadProducts(1)
}

function handleSort(event: {
  sortField?: string | ((item: Product) => unknown)
  sortOrder?: number | null
}) {
  if (typeof event.sortField !== 'string' || !isProductSortField(event.sortField)) {
    return
  }

  sortField.value = event.sortField
  sortOrder.value = event.sortOrder === -1 ? -1 : 1
  sortDirection.value = sortOrder.value === -1 ? 'desc' : 'asc'
  void loadProducts(1)
}

function openCreateDialog() {
  formMode.value = 'create'
  selectedProduct.value = null
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

function openEditDialog(product: Product) {
  formMode.value = 'edit'
  selectedProduct.value = product
  formErrorMessage.value = ''
  validationErrors.value = {}
  formDialogVisible.value = true
}

function openBarcodeDialog(product: Product | null = null, mode: 'scan' | 'generate' = 'scan') {
  selectedBarcodeProduct.value = product
  barcodeDialogMode.value = mode
  barcodeDialogVisible.value = true
}

async function saveProduct(payload: ProductPayload) {
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
    if (formMode.value === 'edit' && selectedProduct.value) {
      await productService.updateProduct(authStore.token, selectedProduct.value.id, payload)
      successMessage.value = 'Produk berhasil diperbarui.'
    } else {
      await productService.createProduct(authStore.token, payload)
      successMessage.value = 'Produk berhasil ditambahkan.'
    }

    formDialogVisible.value = false
    await loadProducts()
  } catch (error) {
    await handleApiError(error, 'form')
  } finally {
    isSubmitting.value = false
  }
}

function confirmDeleteProduct(product: Product) {
  confirm.require({
    header: 'Hapus Produk',
    message: `Apakah Anda yakin ingin menghapus produk "${product.name}"?`,
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
      void deleteProduct(product)
    },
  })
}

async function deleteProduct(product: Product) {
  if (!authStore.token) {
    return
  }

  actionId.value = product.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await productService.deleteProduct(authStore.token, product.id)
    successMessage.value = 'Produk berhasil dihapus.'
    await loadProducts()
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
      const message = 'Anda tidak memiliki akses untuk mengelola data produk.'
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

  const message = 'Data produk belum bisa diproses. Silakan coba lagi.'
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

function formatMinStock(value: string | number) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(Number(value))
}

function formatNullable(value: string | null | undefined) {
  return value?.trim() || '-'
}

function formatRelationName(value?: { name: string } | null) {
  return value?.name ?? '-'
}

function isProductSortField(value: string): value is ProductSortField {
  return ['id', 'sku', 'name', 'type', 'min_stock', 'is_active', 'created_at'].includes(value)
}

function isLoadingRow(row: ProductTableRow): row is ProductLoadingRow {
  return '__loading' in row
}
</script>

<template>
  <DashboardLayout>
    <section class="app-page">
      <div class="app-page-header">
        <div>
          <p class="app-eyebrow">Inventory</p>
          <h2 class="app-page-title">Produk</h2>
          <p class="app-page-description">
            Kelola SKU, barcode, kategori, satuan, dan minimum stok untuk kebutuhan inventori.
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
          <Button
            label="Scan Barcode"
            icon="pi pi-barcode"
            severity="secondary"
            outlined
            @click="openBarcodeDialog()"
          />

          <Button
            v-if="canCreate"
            label="Tambah Produk"
            :disabled="isLoadingReferences"
            @click="openCreateDialog"
          />
        </div>
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
              <h3 class="text-base font-semibold text-slate-950">Daftar Produk</h3>
              <p class="mt-1 text-sm text-slate-500">
                {{ pagination?.total ?? 0 }} produk terdaftar
              </p>
            </div>
          </template>
        </Toolbar>

        <div class="product-filter-panel">
          <div class="product-filter-panel__header">
            <div class="flex items-center gap-3">
              <span class="product-filter-panel__icon">
                <i class="pi pi-filter"></i>
              </span>
              <div>
                <h4 class="text-sm font-extrabold text-slate-950">Filter Produk</h4>
                <p class="mt-1 text-xs font-medium text-slate-500">
                  SKU, barcode, nama, tipe, kategori, satuan, dan status
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

          <div class="product-filter-grid">
            <div class="product-filter-field product-filter-field--wide">
              <label for="product-search" class="product-filter-label">
                <i class="pi pi-search"></i>
                Pencarian
              </label>
              <InputText
                id="product-search"
                v-model="searchQuery"
                class="w-full"
                placeholder="SKU, barcode, nama, atau deskripsi"
                :disabled="isLoading"
                @keydown.enter.prevent="applyFilters"
              />
            </div>

            <div class="product-filter-field">
              <label for="product-type-filter" class="product-filter-label">
                <i class="pi pi-tags"></i>
                Tipe
              </label>
              <Select
                id="product-type-filter"
                v-model="selectedType"
                class="w-full"
                :options="typeOptions"
                option-label="label"
                option-value="value"
                :disabled="isLoading"
              />
            </div>

            <div class="product-filter-field">
              <label for="product-category-filter" class="product-filter-label">
                <i class="pi pi-folder"></i>
                Kategori
              </label>
              <Select
                id="product-category-filter"
                v-model="selectedCategoryId"
                class="w-full"
                :options="categoryFilterOptions"
                option-label="label"
                option-value="value"
                filter
                :disabled="isLoading || isLoadingReferences"
              />
            </div>

            <div class="product-filter-field">
              <label for="product-unit-filter" class="product-filter-label">
                <i class="pi pi-box"></i>
                Satuan
              </label>
              <Select
                id="product-unit-filter"
                v-model="selectedUnitId"
                class="w-full"
                :options="unitFilterOptions"
                option-label="label"
                option-value="value"
                filter
                :disabled="isLoading || isLoadingReferences"
              />
            </div>

            <div class="product-filter-field">
              <label for="product-status-filter" class="product-filter-label">
                <i class="pi pi-check-circle"></i>
                Status
              </label>
              <Select
                id="product-status-filter"
                v-model="selectedActiveStatus"
                class="w-full"
                :options="activeOptions"
                option-label="label"
                option-value="value"
                :disabled="isLoading"
              />
            </div>

            <div class="product-filter-actions">
              <Button
                label="Terapkan"
                icon="pi pi-search"
                :disabled="isLoading"
                @click="applyFilters"
              />
              <Button
                label="Reset"
                icon="pi pi-times"
                severity="secondary"
                outlined
                :disabled="isLoading"
                @click="clearFilters"
              />
              <Button
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                rounded
                aria-label="Muat ulang data produk"
                title="Muat ulang data produk"
                :disabled="isLoading"
                @click="loadProducts()"
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
          current-page-report-template="Menampilkan {first} sampai {last} dari {totalRecords} produk"
          @page="handlePage"
          @sort="handleSort"
        >
          <template #empty>
            <div class="app-empty-state">Belum ada data produk.</div>
          </template>

          <Column field="sku" header="SKU" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="8rem" />
              <span v-else class="font-semibold text-slate-950">{{ data.sku }}</span>
            </template>
          </Column>
          <Column field="name" header="Nama" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="12rem" />
              <div v-else>
                <p class="font-semibold text-slate-950">{{ data.name }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ formatNullable(data.barcode) }}</p>
              </div>
            </template>
          </Column>
          <Column field="type" header="Tipe" header-class="text-center" sortable>
            <template #body="{ data }">
              <div class="flex justify-center">
                <Skeleton
                  v-if="isLoadingRow(data)"
                  height="1.5rem"
                  width="7rem"
                  border-radius="999px"
                />
                <ProductTypeTag v-else :type="data.type" />
              </div>
            </template>
          </Column>
          <Column header="Kategori" header-class="text-center">
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="8rem" />
              <span v-else class="text-slate-600">{{ formatRelationName(data.category) }}</span>
            </template>
          </Column>
          <Column header="Satuan" header-class="text-center">
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="6rem" />
              <span v-else class="text-slate-600">{{ formatRelationName(data.unit) }}</span>
            </template>
          </Column>
          <Column field="min_stock" header="Min. Stok" header-class="text-center" sortable>
            <template #body="{ data }">
              <Skeleton v-if="isLoadingRow(data)" height="1.25rem" width="5rem" />
              <span v-else class="font-semibold text-slate-700">
                {{ formatMinStock(data.min_stock) }}
              </span>
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
          <Column header="Aksi" header-class="text-center" body-class="text-right">
            <template #body="{ data }">
              <div v-if="isLoadingRow(data)" class="flex justify-center gap-2">
                <Skeleton height="2rem" width="5.5rem" />
                <Skeleton height="2rem" width="4rem" />
                <Skeleton height="2rem" width="4.5rem" />
              </div>
              <div v-else class="flex justify-center gap-2">
                <Button
                  label="Generate Barcode"
                  icon="pi pi-barcode"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="openBarcodeDialog(data, 'generate')"
                />
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
                  @click="confirmDeleteProduct(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <ProductFormDialog
        v-model:visible="formDialogVisible"
        :mode="formMode"
        :product="selectedProduct"
        :categories="categories"
        :units="units"
        :submitting="isSubmitting"
        :errors="validationErrors"
        :message="formErrorMessage"
        @submit="saveProduct"
      />

      <ProductBarcodeDialog
        v-model:visible="barcodeDialogVisible"
        :product="selectedBarcodeProduct"
        :mode="barcodeDialogMode"
      />

      <ConfirmDialog />
    </section>
  </DashboardLayout>
</template>

<style scoped>
.product-filter-panel {
  border-bottom: 1px solid var(--sf-border);
  background:
    linear-gradient(180deg, rgba(240, 253, 250, 0.72), rgba(255, 255, 255, 0.84)),
    linear-gradient(135deg, rgba(14, 165, 233, 0.08), transparent 42%);
  padding: 1rem;
}

.product-filter-panel__header {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.product-filter-panel__icon {
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

.product-filter-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
}

.product-filter-field {
  min-width: 0;
}

.product-filter-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.45rem;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 800;
}

.product-filter-label i {
  color: var(--sf-primary);
  font-size: 0.85rem;
}

.product-filter-actions {
  display: flex;
  align-items: end;
  gap: 0.55rem;
}

:deep(.p-datatable-column-header-content),
:deep(.p-column-header-content) {
  justify-content: center;
}

@media (min-width: 640px) {
  .product-filter-panel__header {
    flex-direction: row;
    align-items: center;
  }

  .product-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .product-filter-field--wide,
  .product-filter-actions {
    grid-column: span 2;
  }
}

@media (min-width: 1280px) {
  .product-filter-grid {
    grid-template-columns: minmax(16rem, 1.4fr) repeat(4, minmax(9rem, 1fr)) auto;
    align-items: end;
  }

  .product-filter-field--wide,
  .product-filter-actions {
    grid-column: auto;
  }
}
</style>
