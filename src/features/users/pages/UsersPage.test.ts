import { beforeEach, describe, expect, it, vi } from 'vitest'
import UsersPage from '~/features/users/pages/UsersPage.vue'
import type { UserProfile, UsersData } from '~/features/users/types'
import { usersApi } from '~/features/users/usersApi'
import type { ApiResponse } from '~/helpers/apiHelper'
import { showError } from '~/helpers/toolsHelper'
import { flushPromises, renderWithProviders } from '~/test-utils'

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

vi.mock('~/helpers/toolsHelper', () => ({
  getErrorMessage: (error: unknown) => (error instanceof Error ? error.message : 'Terjadi kesalahan'),
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

const api = vi.mocked(usersApi)

const makeUser = (id: number, name: string, email: string): UserProfile => ({
  id,
  name,
  email,
  email_verified_at: null,
  photo: null,
  created_at: '2026-01-01T00:00:00.000000Z',
  updated_at: '2026-01-01T00:00:00.000000Z',
})

const budi = makeUser(1, 'Budi', 'budi@delcom.org')
const ani = makeUser(2, 'Ani Wijaya', 'ani@del.ac.id')
const citra = makeUser(3, 'Citra', 'citra@delcom.org')

const ok = (users: UserProfile[]): ApiResponse<UsersData> => ({
  status: 'success',
  message: 'OK',
  data: { users },
})

const mountPage = async () => {
  const { wrapper } = renderWithProviders(UsersPage, { stubActions: false })
  await flushPromises()
  return wrapper
}

const names = (wrapper: Awaited<ReturnType<typeof mountPage>>): string[] =>
  wrapper.findAll('li p.font-bold').map((p) => p.text())

describe('UsersPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    api.getAll.mockResolvedValue(ok([budi, ani, citra]))
  })

  it('memuat dan menampilkan semua pengguna', async () => {
    const wrapper = await mountPage()

    expect(api.getAll).toHaveBeenCalledOnce()
    expect(names(wrapper)).toEqual(['Budi', 'Ani Wijaya', 'Citra'])
    expect(wrapper.text()).toContain('budi@delcom.org')
    expect(wrapper.text()).toContain('3 dari 3 pengguna')
  })

  it('menampilkan status memuat selama request berjalan', async () => {
    let resolve!: (value: ApiResponse<UsersData>) => void
    api.getAll.mockReturnValue(new Promise((r) => { resolve = r }))

    const wrapper = await mountPage()
    expect(wrapper.get('[role="status"]').text()).toBe('Memuat pengguna...')
    expect(wrapper.find('li').exists()).toBe(false)

    resolve(ok([budi]))
    await flushPromises()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(names(wrapper)).toEqual(['Budi'])
  })

  it('menampilkan pesan kosong saat belum ada pengguna', async () => {
    api.getAll.mockResolvedValue(ok([]))

    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Belum ada pengguna terdaftar.')
    expect(wrapper.text()).toContain('0 dari 0 pengguna')
  })

  it('menampilkan pesan error saat gagal memuat', async () => {
    api.getAll.mockRejectedValue(new Error('Tidak dapat terhubung ke server.'))

    const wrapper = await mountPage()

    expect(showError).toHaveBeenCalledWith('Tidak dapat terhubung ke server.')
    expect(wrapper.text()).toContain('Belum ada pengguna terdaftar.')
  })

  describe('pencarian', () => {
    it.each([
      ['nama', 'wijaya', ['Ani Wijaya']],
      ['email', 'del.ac', ['Ani Wijaya']],
      ['huruf besar/kecil diabaikan', 'DELCOM', ['Budi', 'Citra']],
      ['spasi di tepi diabaikan', '  budi ', ['Budi']],
    ])('memfilter berdasarkan %s', async (_label, query, expected) => {
      const wrapper = await mountPage()

      await wrapper.get('#search-users').setValue(query)

      expect(names(wrapper)).toEqual(expected)
      expect(wrapper.text()).toContain(`${expected.length} dari 3 pengguna`)
    })

    it('menampilkan pesan khusus saat tidak ada yang cocok', async () => {
      const wrapper = await mountPage()

      await wrapper.get('#search-users').setValue('tidak-ada')

      expect(wrapper.find('li').exists()).toBe(false)
      expect(wrapper.text()).toContain('Tidak ada pengguna yang cocok. Coba kata kunci lain.')
    })

    it('menampilkan semua pengguna lagi saat kata kunci dikosongkan', async () => {
      const wrapper = await mountPage()
      await wrapper.get('#search-users').setValue('budi')

      await wrapper.get('#search-users').setValue('')

      expect(names(wrapper)).toHaveLength(3)
    })
  })
})
