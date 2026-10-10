import type { DOMWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfilePage from '~/features/users/pages/ProfilePage.vue'
import type { UserData, UserProfile } from '~/features/users/types'
import { usersApi } from '~/features/users/usersApi'
import type { ApiResponse } from '~/helpers/apiHelper'
import { showError, showSuccess } from '~/helpers/toolsHelper'
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

const profile: UserProfile = {
  id: 1,
  name: 'Budi',
  email: 'budi@delcom.org',
  email_verified_at: null,
  photo: null,
  created_at: '2026-01-01T00:00:00.000000Z',
  updated_at: '2026-01-01T00:00:00.000000Z',
}

const ok = <T>(data: T): ApiResponse<T> => ({ status: 'success', message: 'OK', data })

const mountPage = async () => {
  const { wrapper } = renderWithProviders(ProfilePage, { stubActions: false })
  await flushPromises()
  return wrapper
}

type Page = Awaited<ReturnType<typeof mountPage>>

const valueOf = (wrapper: Page, selector: string): string =>
  wrapper.get<HTMLInputElement>(selector).element.value

const chooseFiles = async (input: Pick<DOMWrapper<HTMLInputElement>, 'element' | 'trigger'>, files: File[] | null) => {
  Object.defineProperty(input.element, 'files', { value: files, configurable: true })
  await input.trigger('change')
  await flushPromises()
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    api.getProfile.mockResolvedValue(ok<UserData>({ user: profile }))
  })

  describe('memuat profil', () => {
    it('mengisi header dan form dari data profil', async () => {
      const wrapper = await mountPage()

      expect(api.getProfile).toHaveBeenCalledOnce()
      expect(wrapper.text()).toContain('Budi')
      expect(wrapper.text()).toContain('budi@delcom.org')
      expect(valueOf(wrapper, '#profile-name')).toBe('Budi')
      expect(valueOf(wrapper, '#profile-email')).toBe('budi@delcom.org')
    })

    it('menampilkan pesan error dan form kosong saat gagal memuat', async () => {
      api.getProfile.mockRejectedValue(new Error('Sesi berakhir, silakan masuk lagi.'))

      const wrapper = await mountPage()

      expect(showError).toHaveBeenCalledWith('Sesi berakhir, silakan masuk lagi.')
      expect(valueOf(wrapper, '#profile-name')).toBe('')
      expect(valueOf(wrapper, '#profile-email')).toBe('')
    })
  })

  describe('simpan perubahan profil', () => {
    it.each([
      ['nama', '', 'budi@delcom.org'],
      ['email', 'Budi', ''],
    ])('menolak saat %s kosong', async (_label, nameValue, emailValue) => {
      const wrapper = await mountPage()
      await wrapper.get('#profile-name').setValue(nameValue)
      await wrapper.get('#profile-email').setValue(emailValue)

      await wrapper.get('#profile-form').trigger('submit')
      await flushPromises()

      expect(showError).toHaveBeenCalledWith('Nama dan email wajib diisi.')
      expect(api.updateProfile).not.toHaveBeenCalled()
    })

    it('mengirim data yang sudah di-trim lalu menampilkan notifikasi sukses', async () => {
      api.updateProfile.mockResolvedValue(
        ok<UserData>({ user: { ...profile, name: 'Budi Baru', email: 'baru@delcom.org' } }),
      )
      const wrapper = await mountPage()
      await wrapper.get('#profile-name').setValue('  Budi Baru ')
      await wrapper.get('#profile-email').setValue(' baru@delcom.org ')

      await wrapper.get('#profile-form').trigger('submit')
      await flushPromises()

      expect(api.updateProfile).toHaveBeenCalledWith({
        name: 'Budi Baru',
        email: 'baru@delcom.org',
      })
      expect(showSuccess).toHaveBeenCalledWith('Profil berhasil diperbarui.')
      expect(wrapper.text()).toContain('baru@delcom.org')
    })

    it('menampilkan pesan error dari server saat gagal', async () => {
      api.updateProfile.mockRejectedValue(new Error('Email sudah dipakai.'))
      const wrapper = await mountPage()

      await wrapper.get('#profile-form').trigger('submit')
      await flushPromises()

      expect(showError).toHaveBeenCalledWith('Email sudah dipakai.')
      expect(showSuccess).not.toHaveBeenCalled()
    })
  })

  describe('ganti foto', () => {
    const image = new File(['x'], 'foto.png', { type: 'image/png' })

    it('mengunggah foto, mengambil ulang profil, dan menampilkan notifikasi sukses', async () => {
      api.changePhoto.mockResolvedValue(ok(undefined))
      const wrapper = await mountPage()

      await chooseFiles(wrapper.get<HTMLInputElement>('input[type="file"]'), [image])

      expect(api.changePhoto).toHaveBeenCalledWith(image)
      expect(api.getProfile).toHaveBeenCalledTimes(2)
      expect(showSuccess).toHaveBeenCalledWith('Foto profil berhasil diperbarui.')
    })

    it.each([
      ['files bernilai null', null],
      ['tidak ada file yang dipilih', []],
    ])('tidak melakukan apa pun saat %s', async (_label, files) => {
      const wrapper = await mountPage()

      await chooseFiles(wrapper.get<HTMLInputElement>('input[type="file"]'), files)

      expect(api.changePhoto).not.toHaveBeenCalled()
      expect(showError).not.toHaveBeenCalled()
    })

    it('menolak file yang bukan gambar', async () => {
      const wrapper = await mountPage()
      const text = new File(['x'], 'catatan.txt', { type: 'text/plain' })

      await chooseFiles(wrapper.get<HTMLInputElement>('input[type="file"]'), [text])

      expect(showError).toHaveBeenCalledWith('Pilih file gambar (PNG atau JPG).')
      expect(api.changePhoto).not.toHaveBeenCalled()
    })

    it('menampilkan pesan error dari server saat upload gagal', async () => {
      api.changePhoto.mockRejectedValue(new Error('Ukuran foto terlalu besar.'))
      const wrapper = await mountPage()

      await chooseFiles(wrapper.get<HTMLInputElement>('input[type="file"]'), [image])

      expect(showError).toHaveBeenCalledWith('Ukuran foto terlalu besar.')
      expect(showSuccess).not.toHaveBeenCalled()
    })
  })

  describe('ubah kata sandi', () => {
    const fields: Record<string, string> = {
      'current-password': 'lama123',
      'new-password': 'baru123',
      'confirm-password': 'baru123',
    }

    const fillPasswords = async (wrapper: Page, overrides: Record<string, string> = {}) => {
      for (const [id, value] of Object.entries({ ...fields, ...overrides })) {
        await wrapper.get(`#${id}`).setValue(value)
      }
    }

    const submit = async (wrapper: Page) => {
      await wrapper.get('#password-form').trigger('submit')
      await flushPromises()
    }

    it.each(Object.keys(fields))('menolak saat kolom %s kosong', async (emptyId) => {
      const wrapper = await mountPage()
      await fillPasswords(wrapper, { [emptyId]: '' })

      await submit(wrapper)

      expect(showError).toHaveBeenCalledWith('Semua kolom kata sandi wajib diisi.')
      expect(api.changePassword).not.toHaveBeenCalled()
    })

    it('menolak kata sandi baru yang kurang dari 6 karakter', async () => {
      const wrapper = await mountPage()
      await fillPasswords(wrapper, { 'new-password': 'abc', 'confirm-password': 'abc' })

      await submit(wrapper)

      expect(showError).toHaveBeenCalledWith('Kata sandi baru minimal 6 karakter.')
      expect(api.changePassword).not.toHaveBeenCalled()
    })

    it('menolak konfirmasi yang tidak sama', async () => {
      const wrapper = await mountPage()
      await fillPasswords(wrapper, { 'confirm-password': 'beda123' })

      await submit(wrapper)

      expect(showError).toHaveBeenCalledWith(
        'Konfirmasi kata sandi tidak sama dengan kata sandi baru.',
      )
      expect(api.changePassword).not.toHaveBeenCalled()
    })

    it('mengubah kata sandi, mengosongkan form, dan menampilkan notifikasi sukses', async () => {
      api.changePassword.mockResolvedValue(ok(undefined))
      const wrapper = await mountPage()
      await fillPasswords(wrapper)

      await submit(wrapper)

      expect(api.changePassword).toHaveBeenCalledWith({
        password: 'lama123',
        new_password: 'baru123',
        new_password_confirmation: 'baru123',
      })
      expect(showSuccess).toHaveBeenCalledWith('Kata sandi berhasil diubah.')
      for (const id of Object.keys(fields)) {
        expect(valueOf(wrapper, `#${id}`)).toBe('')
      }
    })

    it('menampilkan pesan error dan mempertahankan isian saat gagal', async () => {
      api.changePassword.mockRejectedValue(new Error('Kata sandi saat ini salah.'))
      const wrapper = await mountPage()
      await fillPasswords(wrapper)

      await submit(wrapper)

      expect(showError).toHaveBeenCalledWith('Kata sandi saat ini salah.')
      expect(showSuccess).not.toHaveBeenCalled()
      expect(valueOf(wrapper, '#current-password')).toBe('lama123')
    })
  })
})
