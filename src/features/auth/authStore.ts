import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '~/features/auth/authApi'
import type { LoginPayload, RegisterPayload, User } from '~/features/auth/types'
import { getToken, removeToken, setToken } from '~/helpers/apiHelper'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getToken())
  const user = ref<User | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => token.value !== null)

  // Menyelaraskan state dengan localStorage (token dihapus otomatis oleh apiHelper saat 401)
  const syncToken = (): void => {
    token.value = getToken()
    if (token.value === null) user.value = null
  }

  const clearSession = (): void => {
    removeToken()
    token.value = null
    user.value = null
  }

  const login = async (payload: LoginPayload): Promise<void> => {
    loading.value = true
    try {
      const response = await authApi.login(payload)
      setToken(response.data.token)
      token.value = response.data.token
      user.value = response.data.user
    } finally {
      loading.value = false
    }
  }

  const register = async (payload: RegisterPayload): Promise<void> => {
    loading.value = true
    try {
      await authApi.register(payload)
    } finally {
      loading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    loading.value = true
    try {
      await authApi.logout()
    } catch {
      // Sesi lokal tetap dibersihkan walau server menolak (mis. token sudah kedaluwarsa)
    } finally {
      loading.value = false
    }
    clearSession()
  }

  return { token, user, loading, isAuthenticated, syncToken, clearSession, login, register, logout }
})
