<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/services/apiClient'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const hasSubmitted = ref(false)
const loginError = ref('')

const emailError = computed(() => {
  if (!hasSubmitted.value || email.value.trim()) {
    return ''
  }

  return 'Email wajib diisi.'
})

const passwordError = computed(() => {
  if (!hasSubmitted.value || password.value) {
    return ''
  }

  return 'Password wajib diisi.'
})

const hasErrors = computed(() => Boolean(emailError.value || passwordError.value))

async function submitLogin() {
  hasSubmitted.value = true
  loginError.value = ''

  if (hasErrors.value) {
    return
  }

  try {
    await authStore.login(
      {
        email: email.value.trim(),
        password: password.value,
      },
      rememberMe.value,
    )

    await router.push(getRedirectPath())
  } catch (error) {
    loginError.value =
      error instanceof ApiError ? getApiErrorMessage(error) : 'Login gagal. Silakan coba lagi.'
  }
}

function getRedirectPath() {
  const redirect = route.query.redirect

  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect
  }

  return '/dashboard'
}

function getApiErrorMessage(error: ApiError) {
  const firstValidationMessage = Object.values(error.errors ?? {})[0]?.[0]
  return firstValidationMessage ?? error.message
}
</script>

<template>
  <main class="min-h-screen text-slate-950">
    <section class="grid min-h-screen lg:grid-cols-[3fr_2fr]">
      <div
        class="relative hidden overflow-hidden border-r border-white/10 bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between"
      >
        <div
          class="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(15,118,110,0.88)_48%,rgba(8,145,178,0.82)_100%)]"
        ></div>
        <div
          class="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:42px_42px]"
        ></div>
        <div class="relative z-10 flex items-center gap-3">
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
        <div class="relative z-10 max-w-2xl">
          <p class="mb-4 text-sm font-medium uppercase tracking-[0.24em] text-cyan-100">
            Smart Factory Portal
          </p>
          <h1 class="max-w-xl text-5xl font-semibold leading-tight">
            Smart Factory Inventory & Production Tracking
          </h1>
          <p class="mt-6 max-w-lg text-base leading-7 text-teal-50/85">
            Masuk untuk memantau persediaan, melacak proses produksi, dan menjaga operasional
            pabrik tetap terkendali.
          </p>

          <div
          class="mt-10 max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-2xl shadow-slate-950/20 backdrop-blur"
          >
            <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p class="text-sm font-semibold text-white">Live operation snapshot</p>
                <p class="mt-1 text-xs text-teal-50/70">Inventory, line output, dan work order</p>
              </div>
              <span
                class="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-100"
              >
                Online
              </span>
            </div>
            <div class="space-y-5 p-5">
              <div>
                <div class="mb-2 flex items-center justify-between text-sm">
                  <span class="text-teal-50/80">Line A output</span>
                  <strong class="text-white">84%</strong>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-white/15">
                  <div class="h-full w-[84%] rounded-full bg-cyan-300"></div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="border-l-2 border-amber-300 pl-3">
                  <p class="text-teal-50/70">Low stock alerts</p>
                  <strong class="mt-1 block text-2xl text-white">12</strong>
                </div>
                <div class="border-l-2 border-emerald-300 pl-3">
                  <p class="text-teal-50/70">Work orders active</p>
                  <strong class="mt-1 block text-2xl text-white">38</strong>
                </div>
              </div>

              <div class="space-y-3 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-teal-50/80">Material receiving</span>
                  <span class="font-medium text-white">Synced</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-teal-50/80">Production batch QC</span>
                  <span class="font-medium text-amber-100">Review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="relative z-10 grid grid-cols-3 gap-4 text-sm text-teal-50/80">
          <div class="rounded-lg border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur">
            <strong class="block text-2xl text-white">24/7</strong>
            Monitoring
          </div>
          <div class="rounded-lg border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur">
            <strong class="block text-2xl text-white">3x</strong>
            Faster trace
          </div>
          <div class="rounded-lg border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur">
            <strong class="block text-2xl text-white">98%</strong>
            Stock accuracy
          </div>
        </div>
      </div>

      <div class="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div class="w-full max-w-md">
          <div class="mb-8 lg:hidden">
            <div class="mb-6 flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white"
              >
                SF
              </div>
              <span class="text-lg font-semibold">S-FIPT</span>
            </div>
            <h1 class="text-3xl font-semibold text-slate-950">
              Smart Factory Inventory & Production Tracking
            </h1>
          </div>

          <div class="rounded-2xl border border-teal-900/10 bg-white/88 p-6 shadow-2xl shadow-teal-950/10 backdrop-blur sm:p-8">
            <div class="mb-8 hidden lg:block">
              <p class="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">S-FIPT</p>
              <h2 class="mt-3 text-3xl font-extrabold text-slate-950">Masuk ke sistem</h2>
              <p class="mt-2 text-sm text-slate-500">
                Gunakan kredensial untuk mengakses inventory dan production tracking.
              </p>
            </div>

            <Message v-if="loginError" severity="error" :closable="false">
              {{ loginError }}
            </Message>

            <form class="mt-6 space-y-5" novalidate @submit.prevent="submitLogin">
              <div class="space-y-2">
                <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
                <InputText
                  id="email"
                  v-model="email"
                  class="w-full"
                  type="email"
                  autocomplete="email"
                  placeholder="admin@sfipt.test"
                  :invalid="Boolean(emailError)"
                  aria-describedby="email-error"
                />
                <p v-if="emailError" id="email-error" class="text-sm text-red-600">
                  {{ emailError }}
                </p>
              </div>

              <div class="space-y-2">
                <label for="password" class="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Password
                  v-model="password"
                  input-id="password"
                  class="block w-full"
                  input-class="w-full"
                  autocomplete="current-password"
                  placeholder="Masukkan password"
                  :feedback="false"
                  toggle-mask
                  :invalid="Boolean(passwordError)"
                  aria-describedby="password-error"
                />
                <p v-if="passwordError" id="password-error" class="text-sm text-red-600">
                  {{ passwordError }}
                </p>
              </div>

              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2">
                  <Checkbox v-model="rememberMe" input-id="remember-me" binary />
                  <label for="remember-me" class="text-sm text-slate-600">Remember me</label>
                </div>
                <a href="#" class="text-sm font-medium text-teal-700 hover:text-teal-800">
                  Lupa password?
                </a>
              </div>

              <Button
                class="w-full"
                type="submit"
                label="Masuk"
                :loading="authStore.isLoading"
                :disabled="authStore.isLoading"
              />
            </form>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
