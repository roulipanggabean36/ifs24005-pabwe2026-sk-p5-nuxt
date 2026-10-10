import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  UserProfile,
} from '~/features/users/types'
import { usersApi } from '~/features/users/usersApi'

export const useUsersStore = defineStore('users', () => {
  const users = ref<UserProfile[]>([])
  const selectedUser = ref<UserProfile | null>(null)
  const profile = ref<UserProfile | null>(null)
  /** true saat memuat data (daftar user, detail user, profil) */
  const loading = ref(false)
  /** true saat menyimpan perubahan (profil, foto, kata sandi) */
  const saving = ref(false)

  const fetchUsers = async (): Promise<void> => {
    loading.value = true
    try {
      const response = await usersApi.getAll()
      users.value = response.data.users
    } finally {
      loading.value = false
    }
  }

  const fetchUserById = async (id: number): Promise<UserProfile> => {
    loading.value = true
    try {
      const response = await usersApi.getById(id)
      selectedUser.value = response.data.user
      return response.data.user
    } finally {
      loading.value = false
    }
  }

  const fetchProfile = async (): Promise<UserProfile> => {
    loading.value = true
    try {
      const response = await usersApi.getProfile()
      profile.value = response.data.user
      return response.data.user
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (payload: UpdateProfilePayload): Promise<void> => {
    saving.value = true
    try {
      const response = await usersApi.updateProfile(payload)
      profile.value = response.data.user
    } finally {
      saving.value = false
    }
  }

  const changePhoto = async (photo: File): Promise<void> => {
    saving.value = true
    try {
      await usersApi.changePhoto(photo)
      // Respons upload tidak membawa data user, jadi profil diambil ulang
      const response = await usersApi.getProfile()
      profile.value = response.data.user
    } finally {
      saving.value = false
    }
  }

  const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
    saving.value = true
    try {
      await usersApi.changePassword(payload)
    } finally {
      saving.value = false
    }
  }

  return {
    users,
    selectedUser,
    profile,
    loading,
    saving,
    fetchUsers,
    fetchUserById,
    fetchProfile,
    updateProfile,
    changePhoto,
    changePassword,
  }
})
