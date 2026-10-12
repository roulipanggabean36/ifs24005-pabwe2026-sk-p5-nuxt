<script setup lang="ts">
import { LogIn } from 'lucide-vue-next'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '~/features/auth/authStore'
import AuthLayout from '~/features/auth/layouts/AuthLayout.vue'
import { getErrorMessage, showError, showSuccess } from '~/helpers/toolsHelper'
import { useInput } from '~/hooks/useInput'

const router = useRouter()
const auth = useAuthStore()

const { value: email, onInput: onEmailInput } = useInput('')
const { value: password, onInput: onPasswordInput } = useInput('')

const onSubmit = async (): Promise<void> => {
  if (!email.value.trim() || !password.value) {
    await showError('Email dan kata sandi wajib diisi.')
    return
  }

  try {
    await auth.login({ email: email.value.trim(), password: password.value })
    void showSuccess('Berhasil masuk. Selamat datang!')
    await router.push('/')
  } catch (error) {
    await showError(getErrorMessage(error))
  }
}
</script>

<template>
  <AuthLayout
    title="Masuk ke Delcom Cash Flow"
    subtitle="Catat dan pantau arus kas Anda dengan mudah."
  >
    <form class="space-y-5" novalidate @submit.prevent="onSubmit">
      <div>
        <label for="login-email-input" class="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
        <input
          id="login-email-input"
          type="email"
          autocomplete="email"
          placeholder="nama@email.com"
          :value="email"
          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          @input="onEmailInput"
        />
      </div>

      <div>
        <label for="login-password-input" class="mb-1.5 block text-sm font-semibold text-slate-700">
          Kata sandi
        </label>
        <input
          id="login-password-input"
          type="password"
          autocomplete="current-password"
          placeholder="Masukkan kata sandi"
          :value="password"
          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          @input="onPasswordInput"
        />
      </div>

      <button
        type="submit" id="login-submit-button"
        :disabled="auth.loading"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogIn class="h-4 w-4" aria-hidden="true" />
        {{ auth.loading ? 'Memproses...' : 'Masuk' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-600">
      Belum punya akun?
      <RouterLink to="/auth/register" class="font-semibold text-brand-600 hover:text-brand-700">
        Daftar sekarang
      </RouterLink>
    </p>
  </AuthLayout>
</template>
