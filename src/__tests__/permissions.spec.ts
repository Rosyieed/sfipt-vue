import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ConfirmationService from 'primevue/confirmationservice'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import AppSidebar from '@/components/layout/AppSidebar.vue'
import * as categoryService from '@/services/categoryService'
import * as productService from '@/services/productService'
import * as stockMutationService from '@/services/stockMutationService'
import * as stockService from '@/services/stockService'
import * as unitService from '@/services/unitService'
import * as warehouseService from '@/services/warehouseService'
import { useAuthStore } from '@/stores/auth'
import CategoryListView from '@/views/categories/CategoryListView.vue'
import MutationListView from '@/views/mutations/MutationListView.vue'
import StockListView from '@/views/stocks/StockListView.vue'
import UnitListView from '@/views/units/UnitListView.vue'
import WarehouseListView from '@/views/warehouses/WarehouseListView.vue'

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: (options: { accept?: () => void }) => options.accept?.(),
  }),
}))

vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

vi.mock('@/services/categoryService', () => ({
  getCategories: vi.fn(async () => ({
    data: [
      {
        id: 1,
        code: 'KAYU',
        name: 'Kayu',
        description: 'Material berbahan kayu',
        is_active: true,
        created_at: '2026-05-19T01:00:00.000000Z',
      },
    ],
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 1,
  })),
  createCategory: vi.fn(async () => ({
    id: 2,
    code: 'BESI',
    name: 'Besi',
    description: 'Material berbahan besi',
    is_active: true,
  })),
  updateCategory: vi.fn(async () => ({
    id: 1,
    code: 'KAYU',
    name: 'Kayu Solid',
    description: 'Material kayu solid',
    is_active: true,
  })),
  deleteCategory: vi.fn(),
}))

vi.mock('@/services/unitService', () => ({
  getUnits: vi.fn(async () => ({
    data: [
      {
        id: 1,
        code: 'PCS',
        name: 'Pcs',
        description: 'Satuan per item',
        is_active: true,
        created_at: '2026-05-19T01:00:00.000000Z',
      },
    ],
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 1,
  })),
  createUnit: vi.fn(async () => ({
    id: 2,
    code: 'KG',
    name: 'Kilogram',
    description: 'Satuan berat kilogram',
    is_active: true,
  })),
  updateUnit: vi.fn(async () => ({
    id: 1,
    code: 'PCS',
    name: 'Pieces',
    description: 'Satuan per item',
    is_active: true,
  })),
  deleteUnit: vi.fn(),
}))

vi.mock('@/services/warehouseService', () => ({
  getWarehouses: vi.fn(async () => ({
    data: [
      {
        id: 1,
        code: 'WH-001',
        name: 'Main Warehouse',
        location: 'Plant 1',
        type: 'general',
        is_active: true,
        created_at: '2026-05-13T01:00:00.000000Z',
      },
    ],
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 1,
  })),
  createWarehouse: vi.fn(async () => ({
    id: 2,
    code: 'WH-002',
    name: 'Dialog Warehouse',
    location: 'Plant 2',
    type: 'general',
    is_active: true,
  })),
  updateWarehouse: vi.fn(async () => ({
    id: 1,
    code: 'WH-001',
    name: 'Updated Warehouse',
    location: 'Plant 1',
    type: 'general',
    is_active: true,
  })),
  deleteWarehouse: vi.fn(),
}))

vi.mock('@/services/productService', () => ({
  getProducts: vi.fn(async () => ({
    data: [
      {
        id: 1,
        sku: 'RM-KAYU-001',
        barcode: '899000000001',
        name: 'Kayu Raw Material',
        category_id: 1,
        unit_id: 1,
        type: 'raw_material',
        min_stock: '10.0000',
        description: null,
        is_active: true,
        unit: {
          id: 1,
          code: 'PCS',
          name: 'Pcs',
          description: null,
          is_active: true,
        },
      },
    ],
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 1,
  })),
}))

vi.mock('@/services/stockService', () => ({
  getStocks: vi.fn(async () => ({
    data: [
      {
        id: 1,
        product_id: 1,
        warehouse_id: 1,
        qty: '12.0000',
        product: {
          id: 1,
          sku: 'RM-KAYU-001',
          barcode: '899000000001',
          name: 'Kayu Raw Material',
          category_id: 1,
          unit_id: 1,
          type: 'raw_material',
          min_stock: '10.0000',
          description: null,
          is_active: true,
        },
        warehouse: {
          id: 1,
          code: 'WH-001',
          name: 'Main Warehouse',
          location: 'Plant 1',
          type: 'general',
          is_active: true,
        },
        created_at: '2026-05-28T01:00:00.000000Z',
      },
    ],
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 1,
  })),
  scanStockBarcode: vi.fn(),
}))

vi.mock('@/services/stockMutationService', () => ({
  getStockMutations: vi.fn(async () => ({
    data: [
      {
        id: 1,
        product_id: 1,
        type: 'in',
        from_warehouse_id: null,
        to_warehouse_id: 1,
        qty: '25.0000',
        reference_no: 'GRN-001',
        notes: 'Initial stock',
        product: {
          id: 1,
          sku: 'RM-KAYU-001',
          barcode: '899000000001',
          name: 'Kayu Raw Material',
          category_id: 1,
          unit_id: 1,
          type: 'raw_material',
          min_stock: '10.0000',
          description: null,
          is_active: true,
        },
        to_warehouse: {
          id: 1,
          code: 'WH-001',
          name: 'Main Warehouse',
          location: 'Plant 1',
          type: 'general',
          is_active: true,
        },
        created_at: '2026-05-28T01:00:00.000000Z',
      },
    ],
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 1,
  })),
  createStockMutation: vi.fn(async () => ({
    id: 2,
    product_id: 1,
    type: 'in',
    from_warehouse_id: null,
    to_warehouse_id: 1,
    qty: '25.0000',
    reference_no: 'GRN-001',
    notes: null,
  })),
}))

describe('permission-aware frontend', () => {
  it('uses all_permissions as the effective permission source', () => {
    const authStore = createAuthStore()

    authStore.user = {
      name: 'Warehouse Operator',
      permissions: [],
      all_permissions: ['warehouses.view', 'warehouses.create'],
    }

    expect(authStore.permissions).toEqual(['warehouses.view', 'warehouses.create'])
    expect(authStore.hasPermission('warehouses.view')).toBe(true)
  })

  it('shows warehouse menu only when user has warehouses.view', async () => {
    const authStore = createAuthStore()
    authStore.user = {
      name: 'No Access',
      all_permissions: [],
    }

    const wrapper = mountSidebar()
    expect(wrapper.text()).not.toContain('Gudang')

    authStore.user = {
      name: 'Warehouse Viewer',
      all_permissions: ['warehouses.view'],
    }
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Gudang')
  })

  it('shows category menu only when user has categories.view', async () => {
    const authStore = createAuthStore()
    authStore.user = {
      name: 'No Access',
      all_permissions: [],
    }

    const wrapper = mountSidebar()
    expect(wrapper.text()).not.toContain('Kategori')

    authStore.user = {
      name: 'Category Viewer',
      all_permissions: ['categories.view'],
    }
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Kategori')
  })

  it('shows unit menu only when user has units.view', async () => {
    const authStore = createAuthStore()
    authStore.user = {
      name: 'No Access',
      all_permissions: [],
    }

    const wrapper = mountSidebar()
    expect(wrapper.text()).not.toContain('Satuan')

    authStore.user = {
      name: 'Unit Viewer',
      all_permissions: ['units.view'],
    }
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Satuan')
  })

  it('shows stock menu only when user has stocks.view', async () => {
    const authStore = createAuthStore()
    authStore.user = {
      name: 'No Access',
      all_permissions: [],
    }

    const wrapper = mountSidebar()
    expect(wrapper.text()).not.toContain('Stok')

    authStore.user = {
      name: 'Stock Viewer',
      all_permissions: ['stocks.view'],
    }
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Stok')
  })

  it('shows mutation menu only when user has mutations.view', async () => {
    const authStore = createAuthStore()
    authStore.user = {
      name: 'No Access',
      all_permissions: [],
    }

    const wrapper = mountSidebar()
    expect(wrapper.text()).not.toContain('Mutasi')

    authStore.user = {
      name: 'Mutation Viewer',
      all_permissions: ['mutations.view'],
    }
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Mutasi')
  })

  it('hides create, edit, and delete warehouse actions without matching permissions', async () => {
    const wrapper = await mountWarehouseList({
      permissions: ['warehouses.view'],
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Main Warehouse')
    expect(wrapper.text()).not.toContain('Tambah Gudang')
    expect(wrapper.text()).not.toContain('Edit')
    expect(wrapper.text()).not.toContain('Hapus')
  })

  it('opens the create dialog and submits a create request when permitted', async () => {
    const wrapper = await mountWarehouseList({
      permissions: ['warehouses.view', 'warehouses.create'],
    })
    await flushPromises()

    await getButton(wrapper, 'Tambah Gudang').trigger('click')

    expect(wrapper.text()).toContain('create')

    await getButton(wrapper, 'Submit Dialog').trigger('click')
    await flushPromises()

    expect(warehouseService.createWarehouse).toHaveBeenCalledWith('token', {
      code: 'WH-002',
      name: 'Dialog Warehouse',
      location: null,
      type: 'general',
      is_active: true,
    })
  })

  it('opens the edit dialog and submits an update request when permitted', async () => {
    const wrapper = await mountWarehouseList({
      permissions: ['warehouses.view', 'warehouses.update'],
    })
    await flushPromises()

    await getButton(wrapper, 'Edit').trigger('click')

    expect(wrapper.text()).toContain('edit')

    await getButton(wrapper, 'Submit Dialog').trigger('click')
    await flushPromises()

    expect(warehouseService.updateWarehouse).toHaveBeenCalledWith('token', 1, {
      code: 'WH-002',
      name: 'Dialog Warehouse',
      location: null,
      type: 'general',
      is_active: true,
    })
  })

  it('hides create and edit category actions without matching permissions', async () => {
    const wrapper = await mountCategoryList({
      permissions: ['categories.view'],
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Kayu')
    expect(wrapper.text()).not.toContain('Tambah Kategori')
    expect(wrapper.text()).not.toContain('Edit')
    expect(wrapper.text()).not.toContain('Hapus')
  })

  it('deletes a category when delete permission is granted', async () => {
    const wrapper = await mountCategoryList({
      permissions: ['categories.view', 'categories.delete'],
    })
    await flushPromises()

    await getButton(wrapper, 'Hapus').trigger('click')
    await flushPromises()

    expect(categoryService.deleteCategory).toHaveBeenCalledWith('token', 1)
  })

  it('opens the category create dialog and submits a create request when permitted', async () => {
    const wrapper = await mountCategoryList({
      permissions: ['categories.view', 'categories.create'],
    })
    await flushPromises()

    await getButton(wrapper, 'Tambah Kategori').trigger('click')

    expect(wrapper.text()).toContain('create')

    await getButton(wrapper, 'Submit Category Dialog').trigger('click')
    await flushPromises()

    expect(categoryService.createCategory).toHaveBeenCalledWith('token', {
      code: 'BESI',
      name: 'Besi',
      description: 'Material berbahan besi',
      is_active: true,
    })
  })

  it('opens the category edit dialog and submits an update request when permitted', async () => {
    const wrapper = await mountCategoryList({
      permissions: ['categories.view', 'categories.update'],
    })
    await flushPromises()

    await getButton(wrapper, 'Edit').trigger('click')

    expect(wrapper.text()).toContain('edit')

    await getButton(wrapper, 'Submit Category Dialog').trigger('click')
    await flushPromises()

    expect(categoryService.updateCategory).toHaveBeenCalledWith('token', 1, {
      code: 'BESI',
      name: 'Besi',
      description: 'Material berbahan besi',
      is_active: true,
    })
  })

  it('hides create and edit unit actions without matching permissions', async () => {
    const wrapper = await mountUnitList({
      permissions: ['units.view'],
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Pcs')
    expect(wrapper.text()).not.toContain('Tambah Satuan')
    expect(wrapper.text()).not.toContain('Edit')
    expect(wrapper.text()).not.toContain('Hapus')
  })

  it('deletes a unit when delete permission is granted', async () => {
    const wrapper = await mountUnitList({
      permissions: ['units.view', 'units.delete'],
    })
    await flushPromises()

    await getButton(wrapper, 'Hapus').trigger('click')
    await flushPromises()

    expect(unitService.deleteUnit).toHaveBeenCalledWith('token', 1)
  })

  it('opens the unit create dialog and submits a create request when permitted', async () => {
    const wrapper = await mountUnitList({
      permissions: ['units.view', 'units.create'],
    })
    await flushPromises()

    await getButton(wrapper, 'Tambah Satuan').trigger('click')

    expect(wrapper.text()).toContain('create')

    await getButton(wrapper, 'Submit Unit Dialog').trigger('click')
    await flushPromises()

    expect(unitService.createUnit).toHaveBeenCalledWith('token', {
      code: 'KG',
      name: 'Kilogram',
      description: 'Satuan berat kilogram',
      is_active: true,
    })
  })

  it('opens the unit edit dialog and submits an update request when permitted', async () => {
    const wrapper = await mountUnitList({
      permissions: ['units.view', 'units.update'],
    })
    await flushPromises()

    await getButton(wrapper, 'Edit').trigger('click')

    expect(wrapper.text()).toContain('edit')

    await getButton(wrapper, 'Submit Unit Dialog').trigger('click')
    await flushPromises()

    expect(unitService.updateUnit).toHaveBeenCalledWith('token', 1, {
      code: 'KG',
      name: 'Kilogram',
      description: 'Satuan berat kilogram',
      is_active: true,
    })
  })

  it('loads stock data with token and default filters', async () => {
    await mountStockList({
      permissions: ['stocks.view'],
    })
    await flushPromises()

    expect(stockService.getStocks).toHaveBeenCalledWith('token', {
      page: 1,
      perPage: 10,
      sort: 'product_id',
      direction: 'asc',
      search: '',
      productId: null,
      warehouseId: null,
      lowStock: null,
    })
    expect(productService.getProducts).toHaveBeenCalled()
    expect(warehouseService.getWarehouses).toHaveBeenCalled()
  })

  it('hides create mutation action without create permission', async () => {
    const wrapper = await mountMutationList({
      permissions: ['mutations.view'],
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Kayu Raw Material')
    expect(wrapper.text()).not.toContain('Tambah Mutasi')
  })

  it('submits an inbound mutation when permitted', async () => {
    const wrapper = await mountMutationList({
      permissions: ['mutations.view', 'mutations.create'],
    })
    await flushPromises()

    await getButton(wrapper, 'Tambah Mutasi').trigger('click')
    await getButton(wrapper, 'Submit In Mutation').trigger('click')
    await flushPromises()

    expect(stockMutationService.createStockMutation).toHaveBeenCalledWith('token', {
      product_id: 1,
      type: 'in',
      to_warehouse_id: 1,
      qty: 25,
      reference_no: 'GRN-001',
      notes: null,
    })
  })

  it('submits a transfer mutation when permitted', async () => {
    const wrapper = await mountMutationList({
      permissions: ['mutations.view', 'mutations.create'],
    })
    await flushPromises()

    await getButton(wrapper, 'Tambah Mutasi').trigger('click')
    await getButton(wrapper, 'Submit Transfer Mutation').trigger('click')
    await flushPromises()

    expect(stockMutationService.createStockMutation).toHaveBeenCalledWith('token', {
      product_id: 1,
      type: 'transfer',
      from_warehouse_id: 1,
      to_warehouse_id: 2,
      qty: 10,
      reference_no: null,
      notes: 'Transfer test',
    })
  })
})

function createAuthStore() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return useAuthStore()
}

function mountSidebar() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/dashboard',
        component: { template: '<div />' },
      },
      {
        path: '/inventory/warehouses',
        component: { template: '<div />' },
      },
      {
        path: '/inventory/categories',
        component: { template: '<div />' },
      },
      {
        path: '/inventory/units',
        component: { template: '<div />' },
      },
      {
        path: '/inventory/stocks',
        component: { template: '<div />' },
      },
      {
        path: '/inventory/mutations',
        component: { template: '<div />' },
      },
    ],
  })

  return mount(AppSidebar, {
    props: {
      open: true,
      closeOnMenuClick: false,
    },
    global: {
      plugins: [
        router,
        [
          PrimeVue,
          {
            theme: {
              preset: Aura,
              options: {
                darkModeSelector: false,
              },
            },
          },
        ],
      ],
    },
  })
}

async function mountStockList({ permissions }: { permissions: string[] }) {
  vi.clearAllMocks()

  const authStore = createAuthStore()
  authStore.token = 'token'
  authStore.user = {
    name: 'Stock User',
    all_permissions: permissions,
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/inventory/stocks',
        component: StockListView,
      },
    ],
  })

  router.push('/inventory/stocks')
  await router.isReady()

  return mount(StockListView, {
    global: {
      plugins: [
        router,
        [
          PrimeVue,
          {
            theme: {
              preset: Aura,
              options: {
                darkModeSelector: false,
              },
            },
          },
        ],
      ],
      stubs: {
        DashboardLayout: {
          template: '<div><slot /></div>',
        },
        Button: {
          props: ['label'],
          template: '<button @click="$emit(\'click\', $event)">{{ label }}</button>',
        },
        Message: {
          template: '<div><slot /></div>',
        },
        Tag: {
          props: ['value'],
          template: '<span>{{ value }}</span>',
        },
        ProductTypeTag: {
          props: ['type'],
          template: '<span>{{ type }}</span>',
        },
        WarehouseTypeTag: {
          props: ['type'],
          template: '<span>{{ type }}</span>',
        },
        Dialog: {
          template: '<div><slot /></div>',
        },
      },
    },
  })
}

async function mountMutationList({ permissions }: { permissions: string[] }) {
  vi.clearAllMocks()

  const authStore = createAuthStore()
  authStore.token = 'token'
  authStore.user = {
    name: 'Mutation User',
    all_permissions: permissions,
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/inventory/mutations',
        component: MutationListView,
      },
    ],
  })

  router.push('/inventory/mutations')
  await router.isReady()

  return mount(MutationListView, {
    global: {
      plugins: [
        router,
        [
          PrimeVue,
          {
            theme: {
              preset: Aura,
              options: {
                darkModeSelector: false,
              },
            },
          },
        ],
      ],
      stubs: {
        DashboardLayout: {
          template: '<div><slot /></div>',
        },
        Button: {
          props: ['label'],
          template: '<button @click="$emit(\'click\', $event)">{{ label }}</button>',
        },
        Message: {
          template: '<div><slot /></div>',
        },
        Tag: {
          props: ['value'],
          template: '<span>{{ value }}</span>',
        },
        MutationTypeTag: {
          props: ['type'],
          template: '<span>{{ type }}</span>',
        },
        MutationFormDialog: {
          props: ['visible'],
          emits: ['submit', 'update:visible'],
          template: `
            <div v-if="visible">
              <button
                @click="$emit('submit', {
                  product_id: 1,
                  type: 'in',
                  to_warehouse_id: 1,
                  qty: 25,
                  reference_no: 'GRN-001',
                  notes: null
                })"
              >
                Submit In Mutation
              </button>
              <button
                @click="$emit('submit', {
                  product_id: 1,
                  type: 'transfer',
                  from_warehouse_id: 1,
                  to_warehouse_id: 2,
                  qty: 10,
                  reference_no: null,
                  notes: 'Transfer test'
                })"
              >
                Submit Transfer Mutation
              </button>
            </div>
          `,
        },
      },
    },
  })
}

async function mountWarehouseList({ permissions }: { permissions: string[] }) {
  vi.clearAllMocks()

  const authStore = createAuthStore()
  authStore.token = 'token'
  authStore.user = {
    name: 'Warehouse User',
    all_permissions: permissions,
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/inventory/warehouses',
        component: WarehouseListView,
      },
    ],
  })

  router.push('/inventory/warehouses')
  await router.isReady()

  return mount(WarehouseListView, {
    global: {
      plugins: [
        router,
        ConfirmationService,
        [
          PrimeVue,
          {
            theme: {
              preset: Aura,
              options: {
                darkModeSelector: false,
              },
            },
          },
        ],
      ],
      stubs: {
        DashboardLayout: {
          template: '<div><slot /></div>',
        },
        Button: {
          props: ['label'],
          template: '<button @click="$emit(\'click\', $event)">{{ label }}</button>',
        },
        Message: {
          template: '<div><slot /></div>',
        },
        Tag: {
          props: ['value'],
          template: '<span>{{ value }}</span>',
        },
        WarehouseFormDialog: {
          props: ['visible', 'mode'],
          emits: ['submit', 'update:visible'],
          template: `
            <div v-if="visible">
              <span>{{ mode }}</span>
              <button
                @click="$emit('submit', {
                  code: 'WH-002',
                  name: 'Dialog Warehouse',
                  location: null,
                  type: 'general',
                  is_active: true
                })"
              >
                Submit Dialog
              </button>
            </div>
          `,
        },
      },
    },
  })
}

async function mountCategoryList({ permissions }: { permissions: string[] }) {
  vi.clearAllMocks()

  const authStore = createAuthStore()
  authStore.token = 'token'
  authStore.user = {
    name: 'Category User',
    all_permissions: permissions,
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/inventory/categories',
        component: CategoryListView,
      },
    ],
  })

  router.push('/inventory/categories')
  await router.isReady()

  return mount(CategoryListView, {
    global: {
      plugins: [
        router,
        ConfirmationService,
        [
          PrimeVue,
          {
            theme: {
              preset: Aura,
              options: {
                darkModeSelector: false,
              },
            },
          },
        ],
      ],
      stubs: {
        DashboardLayout: {
          template: '<div><slot /></div>',
        },
        Button: {
          props: ['label'],
          template: '<button @click="$emit(\'click\', $event)">{{ label }}</button>',
        },
        Message: {
          template: '<div><slot /></div>',
        },
        Tag: {
          props: ['value'],
          template: '<span>{{ value }}</span>',
        },
        CategoryFormDialog: {
          props: ['visible', 'mode'],
          emits: ['submit', 'update:visible'],
          template: `
            <div v-if="visible">
              <span>{{ mode }}</span>
              <button
                @click="$emit('submit', {
                  code: 'BESI',
                  name: 'Besi',
                  description: 'Material berbahan besi',
                  is_active: true
                })"
              >
                Submit Category Dialog
              </button>
            </div>
          `,
        },
      },
    },
  })
}

async function mountUnitList({ permissions }: { permissions: string[] }) {
  vi.clearAllMocks()

  const authStore = createAuthStore()
  authStore.token = 'token'
  authStore.user = {
    name: 'Unit User',
    all_permissions: permissions,
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/inventory/units',
        component: UnitListView,
      },
    ],
  })

  router.push('/inventory/units')
  await router.isReady()

  return mount(UnitListView, {
    global: {
      plugins: [
        router,
        ConfirmationService,
        [
          PrimeVue,
          {
            theme: {
              preset: Aura,
              options: {
                darkModeSelector: false,
              },
            },
          },
        ],
      ],
      stubs: {
        DashboardLayout: {
          template: '<div><slot /></div>',
        },
        Button: {
          props: ['label'],
          template: '<button @click="$emit(\'click\', $event)">{{ label }}</button>',
        },
        Message: {
          template: '<div><slot /></div>',
        },
        Tag: {
          props: ['value'],
          template: '<span>{{ value }}</span>',
        },
        UnitFormDialog: {
          props: ['visible', 'mode'],
          emits: ['submit', 'update:visible'],
          template: `
            <div v-if="visible">
              <span>{{ mode }}</span>
              <button
                @click="$emit('submit', {
                  code: 'KG',
                  name: 'Kilogram',
                  description: 'Satuan berat kilogram',
                  is_active: true
                })"
              >
                Submit Unit Dialog
              </button>
            </div>
          `,
        },
      },
    },
  })
}

function getButton(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper.findAll('button').find((item) => item.text() === label)

  if (!button) {
    throw new Error(`Button "${label}" not found.`)
  }

  return button
}
