import type { LoginData, LoginPayload, RegisterPayload } from '~/features/auth/types'
import { api } from '~/helpers/apiHelper'

export const authApi = {
  login: (payload: LoginPayload) => api.post<LoginData>('/auth/login', payload, { auth: false }),
  register: (payload: RegisterPayload) =>
    api.post<undefined>('/auth/register', payload, { auth: false }),
  logout: () => api.post<undefined>('/auth/logout'),
}
