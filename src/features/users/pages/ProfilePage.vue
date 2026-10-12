<script setup lang="ts">
import { Camera, KeyRound, Save } from 'lucide-vue-next'
import { computed, onMounted } from 'vue'
import UserAvatar from '~/features/users/components/UserAvatar.vue'
import { useUsersStore } from '~/features/users/usersStore'
import { getErrorMessage, showError, showSuccess } from '~/helpers/toolsHelper'
import { useInput } from '~/hooks/useInput'

const MIN_PASSWORD_LENGTH = 6
const INPUT_CLASS =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30'

const usersStore = useUsersStore()

const { value: name, onInput: onNameInput } = useInput<string>('')
const { value: email, onInput: onEmailInput } = useInput<string>('')
const {
  value: currentPassword,
  onInput: onCurrentPasswordInput,
  reset: resetCurrentPassword,
} = useInput<string>('')
const {
  value: newPassword,
  onInput: onNewPasswordInput,
  reset: resetNewPassword,
} = useInput<string>('')
const {
  value: confirmPassword,
  onInput: onConfirmPasswordInput,
  reset: resetConfirmPassword,
} = useInput<string>('')

const displayName = computed(() => usersStore.profile?.name ?? '')
const displayEmail = computed(() => usersStore.profile?.email ?? '')
const displayPhoto = computed(() => usersStore.profile?.photo ?? null)

onMounted(async () => {
  try {
    const profile = await usersStore.fetchProfile()
    name.value = profile.name
    email.value = profile.email
  } catch (error) {
    await showError(getErrorMessage(error))
  }
})

const onSaveProfile = async (): Promise<void> => {
  if (!name.value.trim() || !email.value.trim()) {
    await showError('Nama dan email wajib diisi.')
    return
  }

  try {
    await usersStore.updateProfile({ name: name.value.trim(), email: email.value.trim() })
    void showSuccess('Profil berhasil diperbarui.')
  } catch (error) {
    await showError(getErrorMessage(error))
  }
}

const onPhotoChange = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Dikosongkan agar memilih file yang sama dua kali tetap memicu event change
  input.value = ''
  if (!file) return

  if (!file.type.startsWith('image/')) {
    await showError('Pilih file gambar (PNG atau JPG).')
    return
  }

  try {
    await usersStore.changePhoto(file)
    void showSuccess('Foto profil berhasil diperbarui.')
  } catch (error) {
    await showError(getErrorMessage(error))
  }
}

const onChangePassword = async (): Promise<void> => {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    await showError('Semua kolom kata sandi wajib diisi.')
    return
  }

  if (newPassword.value.length < MIN_PASSWORD_LENGTH) {
    await showError(`Kata sandi baru minimal ${MIN_PASSWORD_LENGTH} karakter.`)
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    await showError('Konfirmasi kata sandi tidak sama dengan kata sandi baru.')
    return
  }

  try {
    await usersStore.changePassword({
      password: currentPassword.value,
      new_password: newPassword.value,
      new_password_confirmation: confirmPassword.value,
    })
    resetCurrentPassword()
    resetNewPassword()
    resetConfirmPassword()
    void showSuccess('Kata sandi berhasil diubah.')
  } catch (error) {
    await showError(getErrorMessage(error))
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-3xl space-y-6">
    <header>
      <h1 class="text-2xl font-extrabold text-slate-900">Profil saya</h1>
      <p class="mt-1 text-sm text-slate-600">Kelola data akun dan keamanan kata sandi Anda.</p>
    </header>

    <div
      class="flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row"
    >
      <UserAvatar :name="displayName" :photo="displayPhoto" class="h-24 w-24 text-3xl" />

      <div class="min-w-0 flex-1 text-center sm:text-left">
        <p class="truncate text-lg font-bold text-slate-900">{{ displayName }}</p>
        <p class="truncate text-sm text-slate-600">{{ displayEmail }}</p>
      </div>

      <label
        class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-brand-500/30"
      >
        <Camera class="h-4 w-4" aria-hidden="true" />
        Ganti foto
        <input
          type="file"
          accept="image/*"
          class="sr-only"
          :disabled="usersStore.saving"
          @change="onPhotoChange"
        />
      </label>
    </div>

    <form
      id="profile-form"
      class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      novalidate
      @submit.prevent="onSaveProfile"
    >
      <h2 class="text-base font-bold text-slate-900">Data akun</h2>

      <div>
        <label for="profile-name" class="mb-1.5 block text-sm font-semibold text-slate-700">
          Nama
        </label>
        <input
          id="profile-name"
          type="text"
          autocomplete="name"
          :value="name"
          :class="INPUT_CLASS"
          @input="onNameInput"
        />
      </div>

      <div>
        <label for="profile-email" class="mb-1.5 block text-sm font-semibold text-slate-700">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          autocomplete="email"
          :value="email"
          :class="INPUT_CLASS"
          @input="onEmailInput"
        />
      </div>

      <button
        type="submit"
        :disabled="usersStore.saving"
        class="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save class="h-4 w-4" aria-hidden="true" />
        Simpan perubahan
      </button>
    </form>

    <form
      id="password-form"
      class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      novalidate
      @submit.prevent="onChangePassword"
    >
      <h2 class="text-base font-bold text-slate-900">Ubah kata sandi</h2>

      <div>
        <label for="current-password" class="mb-1.5 block text-sm font-semibold text-slate-700">
          Kata sandi saat ini
        </label>
        <input
          id="current-password"
          type="password"
          autocomplete="current-password"
          :value="currentPassword"
          :class="INPUT_CLASS"
          @input="onCurrentPasswordInput"
        />
      </div>

      <div>
        <label for="new-password" class="mb-1.5 block text-sm font-semibold text-slate-700">
          Kata sandi baru
        </label>
        <input
          id="new-password"
          type="password"
          autocomplete="new-password"
          placeholder="Minimal 6 karakter"
          :value="newPassword"
          :class="INPUT_CLASS"
          @input="onNewPasswordInput"
        />
      </div>

      <div>
        <label for="confirm-password" class="mb-1.5 block text-sm font-semibold text-slate-700">
          Ulangi kata sandi baru
        </label>
        <input
          id="confirm-password"
          type="password"
          autocomplete="new-password"
          :value="confirmPassword"
          :class="INPUT_CLASS"
          @input="onConfirmPasswordInput"
        />
      </div>

      <button
        type="submit"
        :disabled="usersStore.saving"
        class="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <KeyRound class="h-4 w-4" aria-hidden="true" />
        Ubah kata sandi
      </button>
    </form>
  </section>
</template>
