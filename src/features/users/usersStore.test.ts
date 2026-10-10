import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserData, UserProfile, UsersData } from '~/features/users/types'
import { usersApi } from '~/features/users/usersApi'
import { useUsersStore } from '~/features/users/usersStore'
import type { ApiResponse } from '~/helpers/apiHelper'

vi.mock('~/features/users/usersApi', () => ({
  usersApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePhoto: vi.fn(),
    changePassword: vi.fn(),
  },
}))

const api = vi.mocked(usersApi)

const budi: UserProfile = {
  id: 1,
  name: 'Budi',
  email: 'budi@delcom.org',
  email_verified_at: null,
  photo: null,
  created_at: '2026-01-01T00:00:00.000000Z',
  updated_at: '2026-01-01T00:00:00.000000Z',
}

const ani: UserProfile = { ...budi, id: 2, name: 'Ani', email: 'ani@delcom.org' }

const ok = <T>(data: T): ApiResponse<T> => ({ status: 'success', message: 'OK', data })

describe('usersStore', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
  })

  it('memiliki state awal kosong', () => {
    const store = useUsersStore()
    expect(store.users).toEqual([])
    expect(store.selectedUser).toBeNull()
    expect(store.profile).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.saving).toBe(false)
  })

  describe('fetchUsers', () => {
    it('mengisi daftar user', async () => {
      api.getAll.mockResolvedValue(ok<UsersData>({ users: [budi, ani] }))
      const store = useUsersStore()

      await store.fetchUsers()

      expect(store.users).toEqual([budi, ani])
      expect(store.loading).toBe(false)
    })

    it('loading bernilai true selama request berjalan', async () => {
      let resolve!: (value: ApiResponse<UsersData>) => void
      api.getAll.mockReturnValue(new Promise((r) => { resolve = r }))
      const store = useUsersStore()

      const pending = store.fetchUsers()
      expect(store.loading).toBe(true)

      resolve(ok<UsersData>({ users: [] }))
      await pending
      expect(store.loading).toBe(false)
    })

    it('melempar ulang error dan mengembalikan loading ke false', async () => {
      api.getAll.mockRejectedValue(new Error('Gagal memuat'))
      const store = useUsersStore()

      await expect(store.fetchUsers()).rejects.toThrow('Gagal memuat')
      expect(store.loading).toBe(false)
      expect(store.users).toEqual([])
    })
  })

  describe('fetchUserById', () => {
    it('menyimpan dan mengembalikan user terpilih', async () => {
      api.getById.mockResolvedValue(ok<UserData>({ user: ani }))
      const store = useUsersStore()

      await expect(store.fetchUserById(2)).resolves.toEqual(ani)

      expect(api.getById).toHaveBeenCalledWith(2)
      expect(store.selectedUser).toEqual(ani)
      expect(store.loading).toBe(false)
    })

    it('melempar ulang error dan mengembalikan loading ke false', async () => {
      api.getById.mockRejectedValue(new Error('User tidak ditemukan'))
      const store = useUsersStore()

      await expect(store.fetchUserById(99)).rejects.toThrow('User tidak ditemukan')
      expect(store.selectedUser).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchProfile', () => {
    it('menyimpan dan mengembalikan profil', async () => {
      api.getProfile.mockResolvedValue(ok<UserData>({ user: budi }))
      const store = useUsersStore()

      await expect(store.fetchProfile()).resolves.toEqual(budi)

      expect(store.profile).toEqual(budi)
      expect(store.loading).toBe(false)
    })

    it('melempar ulang error dan mengembalikan loading ke false', async () => {
      api.getProfile.mockRejectedValue(new Error('Unauthenticated.'))
      const store = useUsersStore()

      await expect(store.fetchProfile()).rejects.toThrow('Unauthenticated.')
      expect(store.profile).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('updateProfile', () => {
    it('memperbarui profil dari respons API', async () => {
      const updated = { ...budi, name: 'Budi Baru' }
      api.updateProfile.mockResolvedValue(ok<UserData>({ user: updated }))
      const store = useUsersStore()
      const payload = { name: 'Budi Baru', email: 'budi@delcom.org' }

      await store.updateProfile(payload)

      expect(api.updateProfile).toHaveBeenCalledWith(payload)
      expect(store.profile).toEqual(updated)
      expect(store.saving).toBe(false)
    })

    it('saving bernilai true selama request berjalan', async () => {
      let resolve!: (value: ApiResponse<UserData>) => void
      api.updateProfile.mockReturnValue(new Promise((r) => { resolve = r }))
      const store = useUsersStore()

      const pending = store.updateProfile({ name: 'A', email: 'a@b.com' })
      expect(store.saving).toBe(true)

      resolve(ok<UserData>({ user: budi }))
      await pending
      expect(store.saving).toBe(false)
    })

    it('melempar ulang error dan tidak mengubah profil', async () => {
      api.updateProfile.mockRejectedValue(new Error('Email sudah dipakai'))
      const store = useUsersStore()

      await expect(store.updateProfile({ name: 'A', email: 'a@b.com' })).rejects.toThrow(
        'Email sudah dipakai',
      )
      expect(store.profile).toBeNull()
      expect(store.saving).toBe(false)
    })
  })

  describe('changePhoto', () => {
    const file = new File(['x'], 'foto.png', { type: 'image/png' })

    it('mengunggah foto lalu mengambil ulang profil', async () => {
      const withPhoto = { ...budi, photo: 'img/profile/1.png' }
      api.changePhoto.mockResolvedValue(ok(undefined))
      api.getProfile.mockResolvedValue(ok<UserData>({ user: withPhoto }))
      const store = useUsersStore()

      await store.changePhoto(file)

      expect(api.changePhoto).toHaveBeenCalledWith(file)
      expect(api.getProfile).toHaveBeenCalledOnce()
      expect(store.profile).toEqual(withPhoto)
      expect(store.saving).toBe(false)
    })

    it('tidak mengambil ulang profil saat upload gagal', async () => {
      api.changePhoto.mockRejectedValue(new Error('Upload gagal'))
      const store = useUsersStore()

      await expect(store.changePhoto(file)).rejects.toThrow('Upload gagal')
      expect(api.getProfile).not.toHaveBeenCalled()
      expect(store.saving).toBe(false)
    })
  })

  describe('changePassword', () => {
    const payload = {
      password: 'lama123',
      new_password: 'baru123',
      new_password_confirmation: 'baru123',
    }

    it('memanggil API dan mengembalikan saving ke false', async () => {
      api.changePassword.mockResolvedValue(ok(undefined))
      const store = useUsersStore()

      await store.changePassword(payload)

      expect(api.changePassword).toHaveBeenCalledWith(payload)
      expect(store.saving).toBe(false)
    })

    it('melempar ulang error saat gagal', async () => {
      api.changePassword.mockRejectedValue(new Error('Kata sandi lama salah'))
      const store = useUsersStore()

      await expect(store.changePassword(payload)).rejects.toThrow('Kata sandi lama salah')
      expect(store.saving).toBe(false)
    })
  })
})
