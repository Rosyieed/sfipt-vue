<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const initialIsDesktop =
  typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false
const sidebarOpen = ref(initialIsDesktop)
const isDesktop = ref(initialIsDesktop)
let mediaQuery: MediaQueryList | null = null

onMounted(() => {
  mediaQuery = window.matchMedia('(min-width: 1024px)')
  syncSidebarWithViewport(mediaQuery)
  mediaQuery.addEventListener('change', syncSidebarWithViewport)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', syncSidebarWithViewport)
})

async function handleLogout() {
  try {
    await authStore.logout()
  } finally {
    await router.push('/login')
  }
}

function syncSidebarWithViewport(event: MediaQueryList | MediaQueryListEvent) {
  isDesktop.value = event.matches
  sidebarOpen.value = event.matches
}
</script>

<template>
  <div class="min-h-screen text-slate-950">
    <AppSidebar :open="sidebarOpen" :close-on-menu-click="!isDesktop" @close="sidebarOpen = false" />

    <div
      class="flex min-h-screen flex-col transition-[padding] duration-200"
      :class="{ 'lg:pl-72': sidebarOpen }"
    >
      <AppHeader
        :user-name="authStore.userName"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
        @logout="handleLogout"
      />

      <main class="flex-1 px-4 py-6 lg:px-6">
        <slot />
      </main>

      <AppFooter />
    </div>
  </div>
</template>
