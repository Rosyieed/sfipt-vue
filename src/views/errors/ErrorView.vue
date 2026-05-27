<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { useAuthStore } from '@/stores/auth'

type ErrorStatus = '400' | '401' | '403' | '404' | '500' | '503'

type ErrorContent = {
  eyebrow: string
  title: string
  description: string
  icon: string
  tone: string
  primaryLabel: string
}

const props = withDefaults(
  defineProps<{
    status?: ErrorStatus
  }>(),
  {
    status: '404',
  },
)

const router = useRouter()
const authStore = useAuthStore()

const errorContentByStatus: Record<ErrorStatus, ErrorContent> = {
  '400': {
    eyebrow: 'Bad request',
    title: 'Permintaan tidak bisa diproses',
    description:
      'Ada parameter atau data yang tidak sesuai. Periksa kembali input atau kembali ke halaman sebelumnya.',
    icon: 'pi pi-exclamation-circle',
    tone: 'text-amber-600 bg-amber-50 border-amber-200',
    primaryLabel: 'Kembali ke dashboard',
  },
  '401': {
    eyebrow: 'Unauthorized',
    title: 'Sesi belum valid',
    description:
      'Anda perlu masuk terlebih dahulu atau sesi yang tersimpan sudah tidak berlaku.',
    icon: 'pi pi-lock',
    tone: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    primaryLabel: 'Masuk kembali',
  },
  '403': {
    eyebrow: 'Forbidden',
    title: 'Akses tidak diizinkan',
    description:
      'Akun Anda belum memiliki permission untuk membuka halaman ini. Hubungi administrator jika akses ini diperlukan.',
    icon: 'pi pi-shield',
    tone: 'text-red-600 bg-red-50 border-red-200',
    primaryLabel: 'Kembali ke dashboard',
  },
  '404': {
    eyebrow: 'Not found',
    title: 'Halaman tidak ditemukan',
    description:
      'Alamat yang dibuka tidak tersedia atau sudah dipindahkan. Gunakan menu aplikasi untuk melanjutkan pekerjaan.',
    icon: 'pi pi-map-marker',
    tone: 'text-slate-600 bg-slate-50 border-slate-200',
    primaryLabel: 'Kembali ke dashboard',
  },
  '500': {
    eyebrow: 'Server error',
    title: 'Terjadi gangguan sistem',
    description:
      'Aplikasi belum bisa menyelesaikan permintaan. Coba muat ulang halaman atau ulangi beberapa saat lagi.',
    icon: 'pi pi-server',
    tone: 'text-orange-600 bg-orange-50 border-orange-200',
    primaryLabel: 'Kembali ke dashboard',
  },
  '503': {
    eyebrow: 'Service unavailable',
    title: 'Layanan sementara tidak tersedia',
    description:
      'Server sedang sibuk atau dalam pemeliharaan. Silakan coba kembali beberapa saat lagi.',
    icon: 'pi pi-clock',
    tone: 'text-teal-700 bg-teal-50 border-teal-200',
    primaryLabel: 'Kembali ke dashboard',
  },
}

const content = computed(() => errorContentByStatus[props.status])
const shellComponent = computed(() => (authStore.isAuthenticated ? DashboardLayout : 'main'))
const shellClass = computed(() =>
  authStore.isAuthenticated
    ? ''
    : 'flex min-h-screen items-center justify-center px-4 py-10 text-slate-950',
)
const primaryRoute = computed(() =>
  props.status === '401' && !authStore.isAuthenticated ? '/login' : '/dashboard',
)

async function goToPrimaryRoute() {
  await router.push(primaryRoute.value)
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  void goToPrimaryRoute()
}
</script>

<template>
  <component :is="shellComponent" :class="shellClass">
    <section class="app-page flex min-h-[calc(100vh-9rem)] max-w-5xl items-center">
      <div class="app-page-header w-full p-0 sm:p-0">
        <div class="grid w-full gap-0 overflow-hidden lg:grid-cols-[0.95fr_1.25fr]">
          <div
            class="relative min-h-64 overflow-hidden bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(15,118,110,0.9)_52%,rgba(8,145,178,0.82)_100%)] p-8 text-white sm:p-10"
          >
            <div
              class="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:34px_34px]"
            ></div>
            <div class="relative z-10 flex h-full flex-col justify-between gap-10">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/15 font-semibold text-white shadow-sm backdrop-blur"
                >
                  SF
                </div>
                <div>
                  <span class="block text-lg font-semibold">S-FIPT</span>
                  <span class="block text-xs text-teal-50/80">Smart Factory Platform</span>
                </div>
              </div>

              <div>
                <p class="text-sm font-medium uppercase tracking-[0.2em] text-cyan-100">
                  {{ content.eyebrow }}
                </p>
                <p class="mt-4 text-7xl font-black leading-none sm:text-8xl">{{ status }}</p>
              </div>
            </div>
          </div>

          <div class="flex flex-col justify-center bg-white/90 p-8 sm:p-10">
            <div
              class="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl"
              :class="content.tone"
            >
              <i :class="content.icon"></i>
            </div>

            <h1 class="text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl">
              {{ content.title }}
            </h1>
            <p class="mt-4 max-w-xl text-base leading-7 text-slate-500">
              {{ content.description }}
            </p>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button :label="content.primaryLabel" icon="pi pi-home" @click="goToPrimaryRoute" />
              <Button label="Kembali" icon="pi pi-arrow-left" outlined @click="goBack" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </component>
</template>
