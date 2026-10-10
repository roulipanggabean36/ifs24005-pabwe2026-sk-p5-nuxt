import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usersApi } from '~/features/users/usersApi'
import { api } from '~/helpers/apiHelper'
import type { ApiResponse } from '~/helpers/apiHelper'

vi.mock('~/helpers/apiHelper', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const response: ApiResponse<undefined> = { status: 'success', message: 'OK', data: undefined }

describe('usersApi', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(api.get).mockResolvedValue(response)
    vi.mocked(api.post).mockResolvedValue(response)
    vi.mocked(api.put).mockResolvedValue(response)
  })

  it('getAll memanggil GET /users', async () => {
    await expect(usersApi.getAll()).resolves.toBe(response)
    expect(api.get).toHaveBeenCalledWith('/users')
  })

  it('getById memanggil GET /users/:id', async () => {
    await expect(usersApi.getById(7)).resolves.toBe(response)
    expect(api.get).toHaveBeenCalledWith('/users/7')
  })

  it('getProfile memanggil GET /users/me', async () => {
    await expect(usersApi.getProfile()).resolves.toBe(response)
    expect(api.get).toHaveBeenCalledWith('/users/me')
  })

  it('updateProfile memanggil PUT /users/me dengan payload', async () => {
    const payload = { name: 'Budi', email: 'budi@delcom.org' }

    await expect(usersApi.updateProfile(payload)).resolves.toBe(response)
    expect(api.put).toHaveBeenCalledWith('/users/me', payload)
  })

  it('changePhoto memanggil POST /users/me/photo dengan FormData berisi file', async () => {
    const file = new File(['isi'], 'foto.png', { type: 'image/png' })

    await expect(usersApi.changePhoto(file)).resolves.toBe(response)

    expect(api.post).toHaveBeenCalledOnce()
    const call = vi.mocked(api.post).mock.calls[0]
    expect(call?.[0]).toBe('/users/me/photo')
    const form = call?.[1] as FormData
    expect(form).toBeInstanceOf(FormData)
    expect((form.get('photo') as File).name).toBe('foto.png')
  })

  it('changePassword memanggil PUT /users/password dengan payload', async () => {
    const payload = {
      password: 'lama123',
      new_password: 'baru123',
      new_password_confirmation: 'baru123',
    }

    await expect(usersApi.changePassword(payload)).resolves.toBe(response)
    expect(api.put).toHaveBeenCalledWith('/users/password', payload)
  })
})
