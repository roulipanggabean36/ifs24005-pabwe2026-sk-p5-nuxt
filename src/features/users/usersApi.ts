import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  UserData,
  UsersData,
} from '~/features/users/types'
import { api } from '~/helpers/apiHelper'

export const usersApi = {
  getAll: () => api.get<UsersData>('/users'),
  getById: (id: number) => api.get<UserData>(`/users/${id}`),
  getProfile: () => api.get<UserData>('/users/me'),
  updateProfile: (payload: UpdateProfilePayload) => api.put<UserData>('/users/me', payload),
  changePhoto: (photo: File) => {
    const form = new FormData()
    form.append('photo', photo)
    return api.post<undefined>('/users/me/photo', form)
  },
  changePassword: (payload: ChangePasswordPayload) =>
    api.put<undefined>('/users/password', payload),
}
