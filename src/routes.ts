import type { RouteRecordRaw } from 'vue-router'

/**
 * Seluruh rute aplikasi (dipakai oleh src/router.options.ts).
 *
 * meta.guestOnly   : hanya untuk pengunjung yang belum masuk (login, register)
 * meta.requiresAuth: wajib sudah masuk; diwariskan ke semua rute anak
 *
 * Aturan akses dijalankan oleh authGuard di src/guards.ts.
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/auth/login',
    name: 'login',
    component: () => import('~/features/auth/pages/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/auth/register',
    name: 'register',
    component: () => import('~/features/auth/pages/RegisterPage.vue'),
    meta: { guestOnly: true },
  },
  {
    // Layout sebagai rute induk: semua halaman anak tampil di dalam <RouterView /> milik layout
    path: '/',
    component: () => import('~/features/cashflows/layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('~/features/cashflows/pages/HomePage.vue'),
      },
      {
        path: 'cash-flows/:id',
        name: 'cash-flow-detail',
        component: () => import('~/features/cashflows/pages/DetailPage.vue'),
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('~/features/users/pages/UsersPage.vue'),
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('~/features/users/pages/ProfilePage.vue'),
      },
    ],
  },
  // Alamat yang tidak dikenal dikembalikan ke beranda (pengunjung belum masuk lanjut ke login)
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/',
  },
]
