<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

type NavigationItem = {
  label: string
  to: string
  icon: string
  permission?: string
}

type Props = {
  open: boolean
  closeOnMenuClick: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()

const masterNavigationItems: NavigationItem[] = [
  {
    label: 'Users',
    to: '/master/users',
    icon: 'pi pi-users',
    permission: 'users.view',
  },
  {
    label: 'Roles',
    to: '/master/roles',
    icon: 'pi pi-shield',
    permission: 'roles.view',
  },
]

const inventoryNavigationItems: NavigationItem[] = [
  {
    label: 'Gudang',
    to: '/inventory/warehouses',
    icon: 'pi pi-warehouse',
    permission: 'warehouses.view',
  },
  {
    label: 'Kategori',
    to: '/inventory/categories',
    icon: 'pi pi-tags',
    permission: 'categories.view',
  },
  {
    label: 'Satuan',
    to: '/inventory/units',
    icon: 'pi pi-box',
    permission: 'units.view',
  },
]

const visibleMasterNavigationItems = computed(() =>
  masterNavigationItems.filter((item) => !item.permission || authStore.hasPermission(item.permission)),
)

const visibleInventoryNavigationItems = computed(() =>
  inventoryNavigationItems.filter((item) => !item.permission || authStore.hasPermission(item.permission)),
)
</script>

<template>
  <div>
    <button
      v-if="open"
      class="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden"
      type="button"
      aria-label="Tutup menu"
      @click="emit('close')"
    ></button>

    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-teal-900/10 bg-white/88 shadow-2xl shadow-slate-950/10 backdrop-blur-xl transition-transform duration-200"
      :class="{ 'translate-x-0': open }"
    >
      <div class="border-b border-teal-900/10 px-5 py-5">
        <div class="flex items-center gap-3">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 font-bold text-white shadow-lg shadow-cyan-900/15"
          >
            SF
          </div>
          <div>
            <p class="font-bold text-slate-950">S-FIPT</p>
            <p class="text-xs font-medium text-slate-500">Factory Command Center</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        <div>
          <p class="px-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
            Utama
          </p>
          <div class="mt-2 space-y-1">
            <RouterLink
              to="/dashboard"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-teal-800"
              active-class="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-cyan-900/15"
              @click="closeOnMenuClick && emit('close')"
            >
              <i class="pi pi-chart-line text-base"></i>
              <span>Dashboard</span>
            </RouterLink>
          </div>
        </div>

        <div v-if="visibleMasterNavigationItems.length">
          <p class="px-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
            Master
          </p>
          <div class="mt-2 space-y-1">
            <RouterLink
              v-for="item in visibleMasterNavigationItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-teal-800"
              active-class="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-cyan-900/15"
              @click="closeOnMenuClick && emit('close')"
            >
              <i :class="[item.icon, 'text-base']"></i>
              <span>{{ item.label }}</span>
            </RouterLink>
          </div>
        </div>

        <div v-if="visibleInventoryNavigationItems.length">
          <p class="px-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
            Inventory
          </p>
          <div class="mt-2 space-y-1">
            <RouterLink
              v-for="item in visibleInventoryNavigationItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-teal-800"
              active-class="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-cyan-900/15"
              @click="closeOnMenuClick && emit('close')"
            >
              <i :class="[item.icon, 'text-base']"></i>
              <span>{{ item.label }}</span>
            </RouterLink>
          </div>
        </div>
      </nav>

      <div class="border-t border-teal-900/10 p-4">
        <div class="rounded-xl border border-teal-900/10 bg-teal-50/70 p-3 text-xs text-slate-600">
          <p class="font-bold text-slate-900">Smart Factory</p>
          <p class="mt-1 leading-5">Inventory & Production Tracking</p>
        </div>
      </div>
    </aside>
  </div>
</template>
