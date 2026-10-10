import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '~/features/auth/authApi'
import { api } from '~/helpers/apiHelper'

vi.mock('~/helpers/apiHelper', () => ({
  api: { post: vi.fn() },
}))

const post = vi.mocked(api.post)

describe('authApi', () => {
  beforeEach(() => {
    post.mockResolvedValue({ status: 'success', message: 'OK', data: undefined })
  })

  it('login memanggil POST /auth/login tanpa token', async () => {
    const payload = { email: 'a@b.com', password: 'rahasia' }
    await authApi.login(payload)
    expect(post).toHaveBeenCalledWith('/auth/login', payload, { auth: false })
  })

  it('register memanggil POST /auth/register tanpa token', async () => {
    const payload = { name: 'Budi', email: 'a@b.com', password: 'rahasia' }
    await authApi.register(payload)
    expect(post).toHaveBeenCalledWith('/auth/register', payload, { auth: false })
  })

  it('logout memanggil POST /auth/logout', async () => {
    await authApi.logout()
    expect(post).toHaveBeenCalledWith('/auth/logout')
  })
})
