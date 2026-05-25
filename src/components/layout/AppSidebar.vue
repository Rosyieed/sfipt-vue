<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

type NavigationItem = {
  label: string
  to: string
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

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
  },
  {
    label: 'Users',
    to: '/master/users',
    permission: 'users.view',
  },
  {
    label: 'Roles',
    to: '/master/roles',
    permission: 'roles.view',
  },
  {
    label: 'Gudang',
    to: '/master/warehouses',
    permission: 'warehouses.view',
  },
  {
    label: 'Kategori',
    to: '/master/categories',
    permission: 'categories.view',
  },
]

const visibleNavigationItems = computed(() =>
  navigationItems.filter((item) => !item.permission || authStore.hasPermission(item.permission)),
)
</script>

<template>
  <div>
    <button
      v-if="open"
      class="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
      type="button"
      aria-label="Tutup menu"
      @click="emit('close')"
    ></button>

    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-slate-200 bg-white transition-transform duration-200"
      :class="{ 'translate-x-0': open }"
    >
      <div class="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
            SF
          </div>
          <div>
            <p class="font-semibold text-slate-950">S-FIPT</p>
            <p class="text-xs text-slate-500">Admin Portal</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 space-y-4 px-3 py-4">
        <div>
          <p class="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Utama
          </p>
          <div class="mt-2 space-y-1">
            <RouterLink
              to="/dashboard"
              class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              active-class="bg-teal-50 text-teal-700"
              @click="closeOnMenuClick && emit('close')"
            >
              Dashboard
            </RouterLink>
          </div>
        </div>

        <div v-if="visibleNavigationItems.some((item) => item.to !== '/dashboard')">
          <p class="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Master
          </p>
          <div class="mt-2 space-y-1">
            <RouterLink
              v-for="item in visibleNavigationItems.filter((item) => item.to !== '/dashboard')"
              :key="item.to"
              :to="item.to"
              class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              active-class="bg-teal-50 text-teal-700"
              @click="closeOnMenuClick && emit('close')"
            >
              {{ item.label }}
            </RouterLink>
          </div>
        </div>
      </nav>

      <div class="flex h-14 items-center border-t border-slate-200 px-4 text-xs text-slate-500">
        Smart Factory Inventory & Production Tracking.
      </div>
    </aside>
  </div>
</template>
