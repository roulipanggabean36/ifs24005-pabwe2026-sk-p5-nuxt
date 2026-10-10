import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '~/features/auth/authApi'
import { useAuthStore } from '~/features/auth/authStore'
import type { LoginData, User } from '~/features/auth/types'
import { TOKEN_KEY, getToken, removeToken, setToken } from '~/helpers/apiHelper'
import type { ApiResponse } from '~/helpers/apiHelper'

vi.mock('~/features/auth/authApi', () => ({
  authApi: { login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}))

const api = vi.mocked(authApi)

const user: User = {
  id: 1,
  name: 'Budi',
  email: 'budi@delcom.org',
  email_verified_at: null,
  created_at: '2026-01-01T00:00:00.000000Z',
  updated_at: '2026-01-01T00:00:00.000000Z',
}

const loginResponse: ApiResponse<LoginData> = {
  status: 'success',
  message: 'Berhasil login',
  data: { user, token: 'tok-123' },
}

const emptyResponse: ApiResponse<undefined> = {
  status: 'success',
  message: 'OK',
  data: undefined,
}

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('state awal', () => {
    it('belum terautentikasi saat tidak ada token', () => {
      const store = useAuthStore()
      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.isAuthenticated).toBe(false)
    })

    it('terautentikasi saat token sudah tersimpan', () => {
      setToken('saved')
      const store = useAuthStore()
      expect(store.token).toBe('saved')
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('login', () => {
    it('menyimpan token dan user saat berhasil', async () => {
      api.login.mockResolvedValue(loginResponse)
      const store = useAuthStore()

      await store.login({ email: 'budi@delcom.org', password: 'rahasia' })

      expect(api.login).toHaveBeenCalledWith({ email: 'budi@delcom.org', password: 'rahasia' })
      expect(localStorage.getItem(TOKEN_KEY)).toBe('tok-123')
      expect(store.token).toBe('tok-123')
      expect(store.user).toEqual(user)
      expect(store.isAuthenticated).toBe(true)
      expect(store.loading).toBe(false)
    })

    it('loading bernilai true selama request berjalan', async () => {
      let resolve!: (value: ApiResponse<LoginData>) => void
      api.login.mockReturnValue(new Promise((r) => { resolve = r }))
      const store = useAuthStore()

      const pending = store.login({ email: 'a@b.com', password: 'x' })
      expect(store.loading).toBe(true)

      resolve(loginResponse)
      await pending
      expect(store.loading).toBe(false)
    })

    it('melempar ulang error dan tidak menyimpan token saat gagal', async () => {
      api.login.mockRejectedValue(new Error('Kredensial akun tidak ditemukan'))
      const store = useAuthStore()

      await expect(store.login({ email: 'a@b.com', password: 'x' })).rejects.toThrow(
        'Kredensial akun tidak ditemukan',
      )

      expect(getToken()).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.loading).toBe(false)
    })
  })

  describe('register', () => {
    it('memanggil API dan mengembalikan loading ke false', async () => {
      api.register.mockResolvedValue(emptyResponse)
      const store = useAuthStore()
      const payload = { name: 'Budi', email: 'budi@delcom.org', password: 'rahasia' }

      await store.register(payload)

      expect(api.register).toHaveBeenCalledWith(payload)
      expect(store.isAuthenticated).toBe(false)
      expect(store.loading).toBe(false)
    })

    it('melempar ulang error saat gagal', async () => {
      api.register.mockRejectedValue(new Error('Data tidak valid'))
      const store = useAuthStore()

      await expect(
        store.register({ name: 'Budi', email: 'budi@delcom.org', password: 'rahasia' }),
      ).rejects.toThrow('Data tidak valid')
      expect(store.loading).toBe(false)
    })
  })

  describe('logout', () => {
    it('membersihkan sesi setelah API berhasil', async () => {
      api.login.mockResolvedValue(loginResponse)
      api.logout.mockResolvedValue(emptyResponse)
      const store = useAuthStore()
      await store.login({ email: 'a@b.com', password: 'x' })

      await store.logout()

      expect(api.logout).toHaveBeenCalledOnce()
      expect(getToken()).toBeNull()
      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('tetap membersihkan sesi walau API gagal', async () => {
      setToken('tok')
      api.logout.mockRejectedValue(new Error('Unauthenticated.'))
      const store = useAuthStore()

      await expect(store.logout()).resolves.toBeUndefined()

      expect(getToken()).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('syncToken', () => {
    it('mengosongkan user saat token sudah dihapus dari luar store', async () => {
      api.login.mockResolvedValue(loginResponse)
      const store = useAuthStore()
      await store.login({ email: 'a@b.com', password: 'x' })

      removeToken()
      store.syncToken()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('mempertahankan user saat token masih ada', async () => {
      api.login.mockResolvedValue(loginResponse)
      const store = useAuthStore()
      await store.login({ email: 'a@b.com', password: 'x' })

      store.syncToken()

      expect(store.token).toBe('tok-123')
      expect(store.user).toEqual(user)
    })
  })
})
