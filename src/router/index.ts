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
      path: '/master/users',
      name: 'users',
      component: () => import('@/views/users/UserListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'users.view',
      },
    },
    {
      path: '/inventory/warehouses',
      name: 'warehouses',
      component: () => import('@/views/warehouses/WarehouseListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'warehouses.view',
      },
    },
    {
      path: '/inventory/categories',
      name: 'categories',
      component: () => import('@/views/categories/CategoryListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'categories.view',
      },
    },
    {
      path: '/inventory/units',
      name: 'units',
      component: () => import('@/views/units/UnitListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'units.view',
      },
    },
    {
      path: '/inventory/products',
      name: 'products',
      component: () => import('@/views/products/ProductListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'products.view',
      },
    },
    {
      path: '/inventory/stocks',
      name: 'stocks',
      component: () => import('@/views/stocks/StockListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'stocks.view',
      },
    },
    {
      path: '/inventory/mutations',
      name: 'mutations',
      component: () => import('@/views/mutations/MutationListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'mutations.view',
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
    {
      path: '/400',
      name: 'bad-request',
      component: () => import('@/views/errors/ErrorView.vue'),
      props: {
        status: '400',
      },
    },
    {
      path: '/401',
      name: 'unauthorized',
      component: () => import('@/views/errors/ErrorView.vue'),
      props: {
        status: '401',
      },
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/views/errors/ErrorView.vue'),
      props: {
        status: '403',
      },
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/404',
      name: 'not-found',
      component: () => import('@/views/errors/ErrorView.vue'),
      props: {
        status: '404',
      },
    },
    {
      path: '/500',
      name: 'server-error',
      component: () => import('@/views/errors/ErrorView.vue'),
      props: {
        status: '500',
      },
    },
    {
      path: '/503',
      name: 'service-unavailable',
      component: () => import('@/views/errors/ErrorView.vue'),
      props: {
        status: '503',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'catch-all-not-found',
      component: () => import('@/views/errors/ErrorView.vue'),
      props: {
        status: '404',
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
        name: 'forbidden',
        query: {
          from: to.fullPath,
        },
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
