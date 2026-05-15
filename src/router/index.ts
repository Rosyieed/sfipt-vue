import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/master/warehouses',
      name: 'warehouses',
      component: () => import('@/views/warehouses/WarehouseListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'warehouses.view',
      },
    },
    {
      path: '/master/roles',
      name: 'roles',
      component: () => import('@/views/roles/RoleListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'roles.view',
      },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (to.meta.requiresAuth && typeof to.meta.permission === 'string') {
    try {
      await authStore.fetchCurrentUser()
    } catch {
      // Keep navigation decision based on the currently stored session.
    }

    if (!authStore.hasPermission(to.meta.permission)) {
      return {
        name: 'dashboard',
      }
    }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return {
      name: 'dashboard',
    }
  }
})

export default router
