import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '~/features/auth/authApi'
import { useAuthStore } from '~/features/auth/authStore'
import LoginPage from '~/features/auth/pages/LoginPage.vue'
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
  return mount(LoginPage, { global: { plugins: [pinia] } })
}

const fill = async (wrapper: ReturnType<typeof mountPage>, email: string, password: string) => {
  await wrapper.find('#login-email-input').setValue(email)
  await wrapper.find('#login-password-input').setValue(password)
}

const submit = async (wrapper: ReturnType<typeof mountPage>) => {
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    push.mockResolvedValue(undefined)
  })

  it('menampilkan form login dan tautan ke halaman daftar', () => {
    const wrapper = mountPage()

    expect(wrapper.find('h1').text()).toBe('Masuk ke Delcom Cash Flow')
    expect(wrapper.find('#login-email-input').exists()).toBe(true)
    expect(wrapper.find('#login-password-input').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Masuk')
    expect(wrapper.find('a[href="/auth/register"]').exists()).toBe(true)
  })

  it('menampilkan status memproses dan menonaktifkan tombol saat loading', () => {
    const wrapper = mountPage(true)
    const button = wrapper.find('button[type="submit"]')

    expect(button.text()).toBe('Memproses...')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('menolak submit saat email kosong', async () => {
    const wrapper = mountPage()

    await submit(wrapper)

    expect(showError).toHaveBeenCalledWith('Email dan kata sandi wajib diisi.')
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('menolak submit saat kata sandi kosong', async () => {
    const wrapper = mountPage()
    await fill(wrapper, 'budi@delcom.org', '')

    await submit(wrapper)

    expect(showError).toHaveBeenCalledWith('Email dan kata sandi wajib diisi.')
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('login berhasil: memanggil API, menampilkan sukses, lalu pindah ke beranda', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      status: 'success',
      message: 'Berhasil login',
      data: {
        user: {
          id: 1,
          name: 'Budi',
          email: 'budi@delcom.org',
          email_verified_at: null,
          created_at: '2026-01-01T00:00:00.000000Z',
          updated_at: '2026-01-01T00:00:00.000000Z',
        },
        token: 'tok',
      },
    })
    const wrapper = mountPage()
    await fill(wrapper, '  budi@delcom.org  ', 'rahasia')

    await submit(wrapper)

    expect(authApi.login).toHaveBeenCalledWith({ email: 'budi@delcom.org', password: 'rahasia' })
    expect(showSuccess).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/')
    expect(showError).not.toHaveBeenCalled()
  })

  it('login gagal: menampilkan pesan error dan tidak berpindah halaman', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Kredensial akun tidak ditemukan'))
    const wrapper = mountPage()
    await fill(wrapper, 'budi@delcom.org', 'salah')

    await submit(wrapper)

    expect(showError).toHaveBeenCalledWith('Kredensial akun tidak ditemukan')
    expect(push).not.toHaveBeenCalled()
  })
})
