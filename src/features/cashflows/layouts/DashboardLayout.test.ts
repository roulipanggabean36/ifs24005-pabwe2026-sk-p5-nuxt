import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '~/features/auth/authStore'
import DashboardLayout from '~/features/cashflows/layouts/DashboardLayout.vue'
import { showConfirm } from '~/helpers/toolsHelper'
import { createMockRouter, flushPromises, renderWithProviders } from '~/test-utils'

vi.mock('~/helpers/toolsHelper', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/helpers/toolsHelper')>()),
  showConfirm: vi.fn(),
}))

const Child = defineComponent({
  render: () => h('p', { 'data-testid': 'child' }, 'Isi halaman'),
})
const Blank = defineComponent({ render: () => h('div') })

// Layout dipasang sebagai route induk dengan <RouterView /> di dalamnya, seperti di routes.ts
const setup = async (path: string) => {
  const router = createMockRouter([
    {
      path: '/',
      component: DashboardLayout,
      children: [
        { path: '', component: Child },
        { path: 'users', component: Child },
        { path: 'profile', component: Child },
      ],
    },
    { path: '/auth/login', component: Blank },
  ])
  await router.push(path)
  await router.isReady()

  const { wrapper, pinia } = renderWithProviders(RouterView, { router })
  await flushPromises()
  return { wrapper, router, auth: useAuthStore(pinia) }
}

const logoutButton = (wrapper: Awaited<ReturnType<typeof setup>>['wrapper']) =>
  wrapper.findAll('button').find((button) => button.text() === 'Keluar')

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('menampilkan nama aplikasi, navigasi, dan isi halaman anak', async () => {
    const { wrapper } = await setup('/')

    expect(wrapper.text()).toContain('Delcom Cash Flow')
    const links = wrapper.findAll('nav a')
    expect(links.map((link) => link.text())).toEqual(['Beranda', 'Pengguna', 'Profil'])
    expect(links.map((link) => link.attributes('href'))).toEqual(['/', '/users', '/profile'])
    expect(wrapper.get('[data-testid="child"]').text()).toBe('Isi halaman')
  })

  it('menyediakan tautan lewati ke konten utama', async () => {
    const { wrapper } = await setup('/')

    expect(wrapper.get('a[href="#konten"]').text()).toBe('Lewati ke konten')
    expect(wrapper.find('main#konten').exists()).toBe(true)
  })

  it.each([
    ['/', 0],
    ['/users', 1],
    ['/profile', 2],
  ])('menandai tautan halaman aktif untuk %s', async (path, activeIndex) => {
    const { wrapper } = await setup(path)

    const current = wrapper.findAll('nav a').map((link) => link.attributes('aria-current'))
    expect(current.map((value) => value === 'page')).toEqual(
      [0, 1, 2].map((index) => index === activeIndex),
    )
  })

  it('keluar dari akun setelah dikonfirmasi lalu menuju halaman masuk', async () => {
    vi.mocked(showConfirm).mockResolvedValue(true)
    const { wrapper, router, auth } = await setup('/')

    await logoutButton(wrapper)?.trigger('click')
    await flushPromises()

    expect(showConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Keluar dari akun?', confirmText: 'Keluar' }),
    )
    expect(auth.logout).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.path).toBe('/auth/login')
  })

  it('tetap di halaman saat konfirmasi keluar dibatalkan', async () => {
    vi.mocked(showConfirm).mockResolvedValue(false)
    const { wrapper, router, auth } = await setup('/')

    await logoutButton(wrapper)?.trigger('click')
    await flushPromises()

    expect(auth.logout).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('menonaktifkan tombol keluar saat proses logout berjalan', async () => {
    const { wrapper, auth } = await setup('/')
    auth.loading = true
    await flushPromises()

    expect(logoutButton(wrapper)?.attributes('disabled')).toBeDefined()
  })
})
