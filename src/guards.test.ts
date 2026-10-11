import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '~/features/auth/authStore'
import { authGuard, HOME_PATH, LOGIN_PATH } from '~/guards'

const setup = (token: string | null) => {
  setActivePinia(
    createTestingPinia({ initialState: { auth: { token } }, stubActions: true, createSpy: vi.fn }),
  )
  return useAuthStore()
}

const route = (meta: Record<string, unknown>) => ({ meta }) as unknown as RouteLocationNormalized

describe('authGuard', () => {
  it('mengarahkan pengunjung yang belum masuk dari halaman wajib login ke halaman masuk', () => {
    setup(null)

    expect(authGuard(route({ requiresAuth: true }))).toBe(LOGIN_PATH)
    expect(LOGIN_PATH).toBe('/auth/login')
  })

  it('mengizinkan pengguna yang sudah masuk membuka halaman wajib login', () => {
    setup('token-valid')

    expect(authGuard(route({ requiresAuth: true }))).toBe(true)
  })

  it('mengarahkan pengguna yang sudah masuk dari halaman khusus tamu ke beranda', () => {
    setup('token-valid')

    expect(authGuard(route({ guestOnly: true }))).toBe(HOME_PATH)
    expect(HOME_PATH).toBe('/')
  })

  it('mengizinkan pengunjung yang belum masuk membuka halaman khusus tamu', () => {
    setup(null)

    expect(authGuard(route({ guestOnly: true }))).toBe(true)
  })

  it('mengizinkan halaman tanpa aturan akses', () => {
    setup(null)

    expect(authGuard(route({}))).toBe(true)
  })

  it('menyelaraskan token dengan localStorage pada setiap perpindahan halaman', () => {
    const auth = setup(null)

    authGuard(route({}))
    authGuard(route({ requiresAuth: true }))

    expect(auth.syncToken).toHaveBeenCalledTimes(2)
  })
})
