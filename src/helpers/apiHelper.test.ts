import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  BASE_URL,
  TOKEN_KEY,
  api,
  buildUrl,
  getToken,
  removeToken,
  request,
  setToken,
} from '~/helpers/apiHelper'

const fetchMock = vi.fn()

const mockResponse = (payload: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(payload),
  }) as unknown as Response

const mockBrokenJson = (status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.reject(new SyntaxError('Unexpected token')),
  }) as unknown as Response

const lastCall = (): [string, RequestInit] => fetchMock.mock.lastCall as [string, RequestInit]
const lastHeaders = (): Record<string, string> => lastCall()[1].headers as Record<string, string>

describe('apiHelper', () => {
  beforeEach(() => {
    localStorage.clear()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('token helpers', () => {
    it('mengembalikan null saat token belum ada', () => {
      expect(getToken()).toBeNull()
    })

    it('menyimpan dan membaca token', () => {
      setToken('abc123')
      expect(localStorage.getItem(TOKEN_KEY)).toBe('abc123')
      expect(getToken()).toBe('abc123')
    })

    it('menghapus token', () => {
      setToken('abc123')
      removeToken()
      expect(getToken()).toBeNull()
    })
  })

  describe('ApiError', () => {
    it('membawa pesan, nama, dan status', () => {
      const error = new ApiError('Gagal', 404)
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('ApiError')
      expect(error.message).toBe('Gagal')
      expect(error.status).toBe(404)
    })
  })

  describe('buildUrl', () => {
    it('menggabungkan base url dan path tanpa query', () => {
      expect(buildUrl('/cash-flows')).toBe(`${BASE_URL}/cash-flows`)
    })

    it('menambahkan query dan melewati nilai kosong', () => {
      const url = buildUrl('/cash-flows', {
        type: 'inflow',
        search: '',
        label: null,
        page: undefined,
        limit: 0,
        flag: false,
      })
      expect(url).toBe(`${BASE_URL}/cash-flows?type=inflow&limit=0&flag=false`)
    })

    it('tidak menambahkan tanda tanya jika semua query kosong', () => {
      expect(buildUrl('/cash-flows', { search: '', label: null })).toBe(`${BASE_URL}/cash-flows`)
    })
  })

  describe('request', () => {
    it('mengirim GET default tanpa body dan tanpa Authorization saat token tidak ada', async () => {
      const payload = { status: 'success', message: 'OK', data: { id: 1 } }
      fetchMock.mockResolvedValue(mockResponse(payload))

      const result = await request<{ id: number }>('/ping')

      expect(result).toEqual(payload)
      expect(lastCall()[0]).toBe(`${BASE_URL}/ping`)
      expect(lastCall()[1].method).toBe('GET')
      expect(lastCall()[1].body).toBeUndefined()
      expect(lastHeaders()).toEqual({ Accept: 'application/json' })
    })

    it('menambahkan header Bearer saat token ada', async () => {
      setToken('tok')
      fetchMock.mockResolvedValue(mockResponse({ status: 'success', message: 'OK', data: null }))

      await request('/me')

      expect(lastHeaders().Authorization).toBe('Bearer tok')
    })

    it('tidak mengirim Bearer saat auth=false', async () => {
      setToken('tok')
      fetchMock.mockResolvedValue(mockResponse({ status: 'success', message: 'OK', data: null }))

      await request('/auth/login', { auth: false })

      expect(lastHeaders().Authorization).toBeUndefined()
    })

    it('mengirim body JSON dengan Content-Type', async () => {
      fetchMock.mockResolvedValue(mockResponse({ status: 'success', message: 'OK', data: null }))

      await request('/items', { method: 'POST', body: { name: 'Gaji' } })

      expect(lastCall()[1].body).toBe(JSON.stringify({ name: 'Gaji' }))
      expect(lastHeaders()['Content-Type']).toBe('application/json')
    })

    it('mengirim query string', async () => {
      fetchMock.mockResolvedValue(mockResponse({ status: 'success', message: 'OK', data: [] }))

      await request('/items', { query: { page: 2 } })

      expect(lastCall()[0]).toBe(`${BASE_URL}/items?page=2`)
    })

    it('melempar ApiError status 0 saat jaringan gagal', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

      const error = await request('/ping').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).status).toBe(0)
      expect((error as ApiError).message).toContain('Tidak dapat terhubung')
    })

    it('melempar ApiError dengan pesan server saat response tidak ok', async () => {
      fetchMock.mockResolvedValue(mockResponse({ status: 'fail', message: 'Data tidak valid', data: null }, 422))

      const error = await request('/items').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).message).toBe('Data tidak valid')
      expect((error as ApiError).status).toBe(422)
    })

    it('memakai pesan cadangan saat response tidak ok dan bukan JSON', async () => {
      fetchMock.mockResolvedValue(mockBrokenJson(500))

      const error = await request('/items').catch((e: unknown) => e)

      expect((error as ApiError).message).toBe('Permintaan gagal (500)')
      expect((error as ApiError).status).toBe(500)
    })

    it('melempar ApiError saat response ok tetapi bukan JSON', async () => {
      fetchMock.mockResolvedValue(mockBrokenJson(200))

      const error = await request('/items').catch((e: unknown) => e)

      expect((error as ApiError).message).toBe('Permintaan gagal (200)')
      expect((error as ApiError).status).toBe(200)
    })

    it('melempar ApiError saat status=fail walau status 200', async () => {
      fetchMock.mockResolvedValue(mockResponse({ status: 'fail', message: 'Ditolak', data: null }, 200))

      const error = await request('/items').catch((e: unknown) => e)

      expect((error as ApiError).message).toBe('Ditolak')
    })

    it('menghapus token saat 401 pada request terautentikasi', async () => {
      setToken('expired')
      fetchMock.mockResolvedValue(mockResponse({ status: 'fail', message: 'Unauthorized', data: null }, 401))

      await request('/me').catch(() => undefined)

      expect(getToken()).toBeNull()
    })

    it('mempertahankan token saat 401 pada request auth=false', async () => {
      setToken('keep')
      fetchMock.mockResolvedValue(mockResponse({ status: 'fail', message: 'Salah', data: null }, 401))

      await request('/auth/login', { auth: false }).catch(() => undefined)

      expect(getToken()).toBe('keep')
    })
  })

  describe('api shortcuts', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(mockResponse({ status: 'success', message: 'OK', data: null }))
    })

    it('get', async () => {
      await api.get('/items', { page: 1 })
      expect(lastCall()[0]).toBe(`${BASE_URL}/items?page=1`)
      expect(lastCall()[1].method).toBe('GET')
    })

    it('post dengan body', async () => {
      await api.post('/items', { a: 1 })
      expect(lastCall()[1].method).toBe('POST')
      expect(lastCall()[1].body).toBe(JSON.stringify({ a: 1 }))
    })

    it('post dengan auth=false', async () => {
      setToken('tok')
      await api.post('/auth/login', { a: 1 }, { auth: false })
      expect(lastHeaders().Authorization).toBeUndefined()
    })

    it('put', async () => {
      await api.put('/items/1', { a: 2 })
      expect(lastCall()[1].method).toBe('PUT')
      expect(lastCall()[1].body).toBe(JSON.stringify({ a: 2 }))
    })

    it('delete', async () => {
      await api.delete('/items/1')
      expect(lastCall()[0]).toBe(`${BASE_URL}/items/1`)
      expect(lastCall()[1].method).toBe('DELETE')
    })
  })
})
