import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, buildUrl } from '~/helpers/apiHelper'

const jsonResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  json: async () => ({ status: 'success', message: 'OK', data }),
})

describe('apiHelper - body FormData', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mengirim FormData apa adanya tanpa header Content-Type JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null))
    vi.stubGlobal('fetch', fetchMock)
    const form = new FormData()
    form.append('photo', new File(['x'], 'foto.png', { type: 'image/png' }))

    await api.post('/users/me/photo', form)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(buildUrl('/users/me/photo'))
    expect(init.method).toBe('POST')
    expect(init.body).toBe(form)
    expect(init.headers).toEqual({ Accept: 'application/json' })
  })

  it('tetap mengirim body JSON dengan Content-Type JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null))
    vi.stubGlobal('fetch', fetchMock)

    await api.post('/auth/login', { email: 'a@b.com' })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body).toBe(JSON.stringify({ email: 'a@b.com' }))
    expect(init.headers).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    })
  })
})
