<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { ApiError } from '@/services/apiClient'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const profileError = ref('')

const stats = computed(() => [
  {
    label: 'Roles',
    value: authStore.roles.length,
    description: 'Role aktif di akun ini',
  },
  {
    label: 'Permissions',
    value: authStore.permissions.length,
    description: 'Izin akses yang tersedia',
  },
  {
    label: 'Session',
    value: authStore.isAuthenticated ? 'Aktif' : 'Tidak aktif',
    description: 'Status autentikasi saat ini',
  },
])

const previewPermissions = computed(() => authStore.permissions.slice(0, 8))

onMounted(async () => {
  try {
    await authStore.fetchCurrentUser()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      authStore.clearSession()
      await router.push('/login')
      return
    }

    profileError.value =
      'Profil belum bisa diperbarui dari API. Data yang tampil berasal dari session tersimpan.'
  }
})
</script>

<template>
  <DashboardLayout>
    <section class="app-page max-w-6xl">
      <div class="app-page-header">
        <div>
          <p class="app-eyebrow">Selamat datang</p>
          <h2 class="app-page-title">Halo, {{ authStore.userName }}</h2>
          <p class="app-page-description">
          Berikut ringkasan sederhana dari profil dan akses akun yang diterima dari API.
          </p>
        </div>
      </div>

      <Message v-if="profileError" class="mb-6" severity="warn" :closable="false">
        {{ profileError }}
      </Message>

      <div class="grid gap-4 md:grid-cols-3">
        <Card v-for="item in stats" :key="item.label" class="app-stat-card">
          <template #content>
            <p class="relative z-10 text-sm font-bold text-slate-500">{{ item.label }}</p>
            <p class="relative z-10 mt-3 text-3xl font-extrabold text-slate-950">{{ item.value }}</p>
            <p class="relative z-10 mt-2 text-sm leading-6 text-slate-500">{{ item.description }}</p>
          </template>
        </Card>
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <template #title>Profil</template>
          <template #content>
            <dl class="space-y-4 text-sm">
              <div>
                <dt class="font-medium text-slate-500">Nama</dt>
                <dd class="mt-1 text-slate-950">{{ authStore.user?.name ?? '-' }}</dd>
              </div>
              <div>
                <dt class="font-medium text-slate-500">Email</dt>
                <dd class="mt-1 text-slate-950">{{ authStore.user?.email ?? '-' }}</dd>
              </div>
              <div>
                <dt class="font-medium text-slate-500">Roles</dt>
                <dd class="mt-2 flex flex-wrap gap-2">
                  <Tag v-for="role in authStore.roles" :key="role" :value="role" severity="info" />
                  <span v-if="!authStore.roles.length" class="text-slate-500">Belum ada role</span>
                </dd>
              </div>
            </dl>
          </template>
        </Card>

        <Card>
          <template #title>Permissions</template>
          <template #content>
            <div class="flex flex-wrap gap-2">
              <Tag
                v-for="permission in previewPermissions"
                :key="permission"
                :value="permission"
                severity="success"
              />
              <span v-if="!authStore.permissions.length" class="text-sm text-slate-500">
                Belum ada permission yang dikirim API.
              </span>
            </div>
            <p
              v-if="authStore.permissions.length > previewPermissions.length"
              class="mt-4 text-sm text-slate-500"
            >
              +{{ authStore.permissions.length - previewPermissions.length }} permission lainnya
            </p>
          </template>
        </Card>
      </div>
    </section>
  </DashboardLayout>
</template>
