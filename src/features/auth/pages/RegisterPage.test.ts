import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '~/features/auth/authApi'
import { useAuthStore } from '~/features/auth/authStore'
import RegisterPage from '~/features/auth/pages/RegisterPage.vue'
import { showError, showSuccess } from '~/helpers/toolsHelper'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    useRouter: () => ({ push }),
    RouterLink: defineComponent({
      props: { to: { type: String, required: true } },
      setup(props, { slots }) {
        return () => h('a', { href: props.to }, slots.default?.())
      },
    }),
  }
})

vi.mock('~/features/auth/authApi', () => ({
  authApi: { login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}))

vi.mock('~/helpers/toolsHelper', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/helpers/toolsHelper')>()
  return { ...original, showError: vi.fn(), showSuccess: vi.fn() }
})

const mountPage = (loading = false) => {
  const pinia = createPinia()
  useAuthStore(pinia).loading = loading
  return mount(RegisterPage, { global: { plugins: [pinia] } })
}

type Wrapper = ReturnType<typeof mountPage>

const fill = async (wrapper: Wrapper, name: string, email: string, password: string) => {
  await wrapper.find('#name').setValue(name)
  await wrapper.find('#email').setValue(email)
  await wrapper.find('#password').setValue(password)
}

const submit = async (wrapper: Wrapper) => {
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

const REQUIRED_MESSAGE = 'Nama, email, dan kata sandi wajib diisi.'

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear()
    push.mockResolvedValue(undefined)
  })

  it('menampilkan form daftar dan tautan ke halaman masuk', () => {
    const wrapper = mountPage()

    expect(wrapper.find('h1').text()).toBe('Buat akun baru')
    expect(wrapper.find('#name').exists()).toBe(true)
    expect(wrapper.find('#email').exists()).toBe(true)
    expect(wrapper.find('#password').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Daftar')
    expect(wrapper.find('a[href="/auth/login"]').exists()).toBe(true)
  })

  it('menampilkan status memproses dan menonaktifkan tombol saat loading', () => {
    const wrapper = mountPage(true)
    const button = wrapper.find('button[type="submit"]')

    expect(button.text()).toBe('Memproses...')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('menolak submit saat nama kosong', async () => {
    const wrapper = mountPage()
    await fill(wrapper, '', 'budi@delcom.org', 'rahasia')

    await submit(wrapper)

    expect(showError).toHaveBeenCalledWith(REQUIRED_MESSAGE)
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('menolak submit saat email kosong', async () => {
    const wrapper = mountPage()
    await fill(wrapper, 'Budi', '', 'rahasia')

    await submit(wrapper)

    expect(showError).toHaveBeenCalledWith(REQUIRED_MESSAGE)
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('menolak submit saat kata sandi kosong', async () => {
    const wrapper = mountPage()
    await fill(wrapper, 'Budi', 'budi@delcom.org', '')

    await submit(wrapper)

    expect(showError).toHaveBeenCalledWith(REQUIRED_MESSAGE)
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('menolak kata sandi yang kurang dari 6 karakter', async () => {
    const wrapper = mountPage()
    await fill(wrapper, 'Budi', 'budi@delcom.org', '12345')

    await submit(wrapper)

    expect(showError).toHaveBeenCalledWith('Kata sandi minimal 6 karakter.')
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('daftar berhasil: memanggil API, menampilkan sukses, lalu pindah ke halaman masuk', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      status: 'success',
      message: 'Berhasil melakukan pendaftaran',
      data: undefined,
    })
    const wrapper = mountPage()
    await fill(wrapper, '  Budi  ', '  budi@delcom.org  ', 'rahasia')

    await submit(wrapper)

    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Budi',
      email: 'budi@delcom.org',
      password: 'rahasia',
    })
    expect(showSuccess).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/auth/login')
    expect(showError).not.toHaveBeenCalled()
  })

  it('daftar gagal: menampilkan pesan error dan tidak berpindah halaman', async () => {
    vi.mocked(authApi.register).mockRejectedValue(new Error('Data tidak valid'))
    const wrapper = mountPage()
    await fill(wrapper, 'Budi', 'budi@delcom.org', 'rahasia')

    await submit(wrapper)

    expect(showError).toHaveBeenCalledWith('Data tidak valid')
    expect(push).not.toHaveBeenCalled()
  })
})
