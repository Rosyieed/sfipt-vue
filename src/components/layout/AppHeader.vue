<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'

type Props = {
  userName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggleSidebar: []
  logout: []
}>()

const userMenu = ref<InstanceType<typeof Menu> | null>(null)
const isUserMenuOpen = ref(false)

const userInitials = computed(() => {
  const words = props.userName.trim().split(/\s+/).filter(Boolean)

  if (!words.length) {
    return 'U'
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
})

const userMenuItems = computed(() => [
  {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: () => emit('logout'),
  },
])

function toggleUserMenu(event: MouseEvent) {
  userMenu.value?.toggle(event)
}
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-teal-900/10 bg-white/78 backdrop-blur-xl">
    <div class="flex h-16 items-center justify-between px-4 lg:px-6">
      <div class="flex items-center gap-3">
        <Button
          severity="secondary"
          text
          rounded
          aria-label="Buka menu"
          @click="emit('toggleSidebar')"
        >
          <span class="flex h-5 w-5 flex-col justify-center gap-1" aria-hidden="true">
            <span class="h-0.5 w-5 rounded bg-current"></span>
            <span class="h-0.5 w-5 rounded bg-current"></span>
            <span class="h-0.5 w-5 rounded bg-current"></span>
          </span>
        </Button>
        <div>
          <p class="text-xs font-extrabold uppercase tracking-[0.18em] text-teal-700">S-FIPT</p>
          <h1 class="text-lg font-bold text-slate-950">Admin Portal</h1>
        </div>
      </div>

      <div class="flex items-center">
        <button
          type="button"
          class="flex items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 text-left transition hover:border-teal-900/10 hover:bg-white/85 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          aria-haspopup="menu"
          :aria-expanded="isUserMenuOpen"
          aria-controls="user-menu"
          @click="toggleUserMenu"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 text-sm font-bold text-white shadow-md shadow-cyan-900/15"
            aria-hidden="true"
          >
            {{ userInitials }}
          </span>
          <span class="hidden text-right sm:block">
            <span class="block text-sm font-bold text-slate-950">{{ userName }}</span>
            <span class="block text-xs text-slate-500">Signed in</span>
          </span>
          <i
            class="pi pi-chevron-down text-xs text-slate-500 transition"
            :class="{ 'rotate-180': isUserMenuOpen }"
            aria-hidden="true"
          ></i>
        </button>
        <Menu
          id="user-menu"
          ref="userMenu"
          :model="userMenuItems"
          popup
          @show="isUserMenuOpen = true"
          @hide="isUserMenuOpen = false"
        />
      </div>
    </div>
  </header>
</template>
