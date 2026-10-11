import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { useAuthStore } from '~/features/auth/authStore'

export const LOGIN_PATH = '/auth/login'
export const HOME_PATH = '/'

/**
 * Penjaga akses untuk setiap perpindahan halaman.
 * - Halaman wajib login + belum masuk  -> ke halaman masuk
 * - Halaman khusus tamu + sudah masuk  -> ke beranda
 * - Selain itu                         -> lanjut
 */
export const authGuard = (to: RouteLocationNormalized): true | RouteLocationRaw => {
  const auth = useAuthStore()
  // Token bisa sudah dihapus apiHelper (respons 401) sejak perpindahan terakhir
  auth.syncToken()

  if (to.meta.requiresAuth === true && !auth.isAuthenticated) return LOGIN_PATH
  if (to.meta.guestOnly === true && auth.isAuthenticated) return HOME_PATH
  return true
}
