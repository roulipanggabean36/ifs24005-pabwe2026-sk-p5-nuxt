import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import type { RouteRecordRaw } from 'vue-router'
import { authGuard } from '~/guards'
import { routes } from '~/routes'
import { createMockRouter } from '~/test-utils'

type Loader = () => Promise<{ default: unknown }>

const collect = (list: RouteRecordRaw[]): RouteRecordRaw[] =>
  list.flatMap((record) => [
    record,
    ...collect('children' in record ? (record.children ?? []) : []),
  ])

describe('routes', () => {
  it('memberi nama dan alamat yang benar untuk setiap halaman', () => {
    const router = createMockRouter(routes)

    expect(router.resolve({ name: 'login' }).path).toBe('/auth/login')
    expect(router.resolve({ name: 'register' }).path).toBe('/auth/register')
    expect(router.resolve({ name: 'home' }).path).toBe('/')
    expect(router.resolve({ name: 'cash-flow-detail', params: { id: 4 } }).path).toBe(
      '/cash-flows/4',
    )
    expect(router.resolve({ name: 'users' }).path).toBe('/users')
    expect(router.resolve({ name: 'profile' }).path).toBe('/profile')
  })

  it('setiap halaman dapat dimuat (lazy import)', async () => {
    const loaders = collect(routes).flatMap((record) =>
      'component' in record && record.component ? [record.component as unknown as Loader] : [],
    )

    expect(loaders).toHaveLength(7)
    for (const load of loaders) {
      expect((await load()).default).toBeDefined()
    }
  })

  describe('akses halaman', () => {
    const makeRouter = (token: string | null) => {
      setActivePinia(
        createTestingPinia({
          initialState: { auth: { token } },
          stubActions: true,
          createSpy: vi.fn,
        }),
      )
      const router = createMockRouter(routes)
      router.beforeEach(authGuard)
      return router
    }

    const visit = async (router: ReturnType<typeof makeRouter>, path: string) => {
      await router.push(path)
      return router.currentRoute.value.fullPath
    }

    it.each(['/', '/cash-flows/4', '/users', '/profile'])(
      'mengarahkan pengunjung belum masuk dari %s ke halaman masuk',
      async (path) => {
        expect(await visit(makeRouter(null), path)).toBe('/auth/login')
      },
    )

    it.each(['/auth/login', '/auth/register'])(
      'mengizinkan pengunjung belum masuk membuka %s',
      async (path) => {
        expect(await visit(makeRouter(null), path)).toBe(path)
      },
    )

    it.each(['/', '/cash-flows/4', '/users', '/profile'])(
      'mengizinkan pengguna yang sudah masuk membuka %s',
      async (path) => {
        expect(await visit(makeRouter('token-valid'), path)).toBe(path)
      },
    )

    it.each(['/auth/login', '/auth/register'])(
      'mengarahkan pengguna yang sudah masuk dari %s ke beranda',
      async (path) => {
        expect(await visit(makeRouter('token-valid'), path)).toBe('/')
      },
    )

    it('mengarahkan alamat tidak dikenal ke beranda bagi pengguna yang sudah masuk', async () => {
      expect(await visit(makeRouter('token-valid'), '/tidak-ada')).toBe('/')
    })

    it('mengarahkan alamat tidak dikenal ke halaman masuk bagi pengunjung belum masuk', async () => {
      expect(await visit(makeRouter(null), '/tidak-ada')).toBe('/auth/login')
    })
  })
})
