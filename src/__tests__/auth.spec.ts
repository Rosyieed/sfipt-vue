import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'

describe('LoginView', () => {
  it('renders login form fields and action', async () => {
    const wrapper = await mountLoginView()

    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Remember me')
    expect(wrapper.text()).toContain('Masuk')
  })

  it('shows required validation messages after empty submit', async () => {
    const wrapper = await mountLoginView()

    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Email wajib diisi.')
    expect(wrapper.text()).toContain('Password wajib diisi.')
  })
})

async function mountLoginView() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/login',
        component: LoginView,
      },
      {
        path: '/dashboard',
        component: DashboardView,
      },
    ],
  })

  router.push('/login')
  await router.isReady()

  return mount(LoginView, {
    global: {
      plugins: [
        pinia,
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
