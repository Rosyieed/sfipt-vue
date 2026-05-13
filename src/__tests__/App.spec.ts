import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import App from '../App.vue'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'

describe('App', () => {
  it('renders the login route', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          redirect: '/login',
        },
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

    const wrapper = mount(App, {
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

    expect(wrapper.text()).toContain('Masuk ke sistem')
  })
})
