<script setup lang="ts">
import { UserPlus } from 'lucide-vue-next'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '~/features/auth/authStore'
import AuthLayout from '~/features/auth/layouts/AuthLayout.vue'
import { getErrorMessage, showError, showSuccess } from '~/helpers/toolsHelper'
import { useInput } from '~/hooks/useInput'

const MIN_PASSWORD_LENGTH = 6

const router = useRouter()
const auth = useAuthStore()

const { value: name, onInput: onNameInput } = useInput<string>('')
const { value: email, onInput: onEmailInput } = useInput<string>('')
const { value: password, onInput: onPasswordInput } = useInput<string>('')

const onSubmit = async (): Promise<void> => {
  if (!name.value.trim() || !email.value.trim() || !password.value) {
    await showError('Nama, email, dan kata sandi wajib diisi.')
    return
  }

  if (password.value.length < MIN_PASSWORD_LENGTH) {
    await showError(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`)
    return
  }

  try {
    await auth.register({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })
    void showSuccess('Pendaftaran berhasil. Silakan masuk.')
    await router.push('/auth/login')
  } catch (error) {
    await showError(getErrorMessage(error))
  }
}
</script>

<template>
  <AuthLayout title="Buat akun baru" subtitle="Mulai kelola arus kas Anda bersama Delcom.">
    <form class="space-y-5" novalidate @submit.prevent="onSubmit">
      <div>
        <label for="name" class="mb-1.5 block text-sm font-semibold text-slate-700">
          Nama lengkap
        </label>
        <input
          id="name"
          type="text"
          autocomplete="name"
          placeholder="Nama Anda"
          :value="name"
          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          @input="onNameInput"
        />
      </div>

      <div>
        <label for="email" class="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
        <input
          id="email"
          type="email"
          autocomplete="email"
          placeholder="nama@email.com"
          :value="email"
          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          @input="onEmailInput"
        />
      </div>

      <div>
        <label for="password" class="mb-1.5 block text-sm font-semibold text-slate-700">
          Kata sandi
        </label>
        <input
          id="password"
          type="password"
          autocomplete="new-password"
          placeholder="Minimal 6 karakter"
          :value="password"
          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          @input="onPasswordInput"
        />
      </div>

      <button
        type="submit"
        :disabled="auth.loading"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <UserPlus class="h-4 w-4" aria-hidden="true" />
        {{ auth.loading ? 'Memproses...' : 'Daftar' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-500">
      Sudah punya akun?
      <RouterLink to="/auth/login" class="font-semibold text-brand-600 hover:text-brand-700">
        Masuk di sini
      </RouterLink>
    </p>
  </AuthLayout>
</template>
