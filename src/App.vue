<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'

const router = useRouter()
const isRouterReady = ref(false)
const isNavigating = ref(false)

const removeBeforeEach = router.beforeEach(() => {
  isNavigating.value = true
})

const removeAfterEach = router.afterEach(() => {
  isNavigating.value = false
})

const removeErrorHandler = router.onError(() => {
  isNavigating.value = false
  isRouterReady.value = true
})

router.isReady().finally(() => {
  isRouterReady.value = true
  isNavigating.value = false
})

const showLoadingScreen = computed(() => !isRouterReady.value)
const showNavigationProgress = computed(() => isRouterReady.value && isNavigating.value)

onBeforeUnmount(() => {
  removeBeforeEach()
  removeAfterEach()
  removeErrorHandler()
})
</script>

<template>
  <RouterView />

  <Transition name="app-progress">
    <div
      v-if="showNavigationProgress"
      class="pointer-events-none fixed inset-x-0 top-0 z-[9998] h-1 bg-gradient-to-r from-teal-600 to-cyan-500 shadow-[0_0_18px_rgba(8,145,178,0.35)]"
      role="progressbar"
      aria-label="Memuat halaman"
    ></div>
  </Transition>

  <Transition name="app-loader">
    <div
      v-if="showLoadingScreen"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--sf-app-bg)]/92 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div
        class="flex w-[min(22rem,calc(100vw-2rem))] flex-col items-center rounded-2xl border border-teal-900/10 bg-white/90 px-8 py-7 text-center shadow-2xl shadow-teal-950/10"
      >
        <div
          class="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 font-bold text-white shadow-lg shadow-cyan-900/20"
        >
          SF
          <span
            class="absolute -inset-1 rounded-2xl border-2 border-cyan-300/60 border-t-transparent"
          ></span>
        </div>
        <p class="mt-5 text-sm font-extrabold uppercase tracking-[0.18em] text-teal-700">
          S-FIPT
        </p>
        <p class="mt-2 text-lg font-bold text-slate-950">Memuat halaman</p>
        <p class="mt-1 text-sm text-slate-500">Menyiapkan data dan tampilan aplikasi.</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.app-progress-enter-active,
.app-progress-leave-active {
  transition: opacity 140ms ease;
}

.app-progress-enter-from,
.app-progress-leave-to {
  opacity: 0;
}

.app-loader-enter-active,
.app-loader-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.app-loader-enter-from,
.app-loader-leave-to {
  opacity: 0;
  transform: scale(0.99);
}

[role='status'] span {
  animation: app-loader-spin 900ms linear infinite;
}

@keyframes app-loader-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
