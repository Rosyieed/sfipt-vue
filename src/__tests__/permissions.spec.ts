import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ConfirmationService from 'primevue/confirmationservice'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import AppSidebar from '@/components/layout/AppSidebar.vue'
import * as categoryService from '@/services/categoryService'
import * as unitService from '@/services/unitService'
import * as warehouseService from '@/services/warehouseService'
import { useAuthStore } from '@/stores/auth'
import CategoryListView from '@/views/categories/CategoryListView.vue'
import UnitListView from '@/views/units/UnitListView.vue'
import WarehouseListView from '@/views/warehouses/WarehouseListView.vue'

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
}))

vi.mock('@/services/warehouseService', () => ({
  getWarehouses: vi.fn(async () => ({
    data: [
      {
        id: 1,
        name: 'Main Warehouse',
        location: 'Plant 1',
        type: 'raw',
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
    name: 'Dialog Warehouse',
    location: 'Plant 2',
    type: 'raw',
    is_active: true,
  })),
  updateWarehouse: vi.fn(async () => ({
    id: 1,
    name: 'Updated Warehouse',
    location: 'Plant 1',
    type: 'raw',
    is_active: true,
  })),
  deleteWarehouse: vi.fn(),
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
      name: 'Dialog Warehouse',
      location: 'Plant 2',
      type: 'raw',
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
      name: 'Dialog Warehouse',
      location: 'Plant 2',
      type: 'raw',
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
        path: '/master/warehouses',
        component: { template: '<div />' },
      },
      {
        path: '/master/categories',
        component: { template: '<div />' },
      },
      {
        path: '/master/units',
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
      plugins: [router],
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
        path: '/master/warehouses',
        component: WarehouseListView,
      },
    ],
  })

  router.push('/master/warehouses')
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
                  name: 'Dialog Warehouse',
                  location: 'Plant 2',
                  type: 'raw',
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
        path: '/master/categories',
        component: CategoryListView,
      },
    ],
  })

  router.push('/master/categories')
  await router.isReady()

  return mount(CategoryListView, {
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
        path: '/master/units',
        component: UnitListView,
      },
    ],
  })

  router.push('/master/units')
  await router.isReady()

  return mount(UnitListView, {
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
