<script setup lang="ts">
import { LogOut, Wallet } from 'lucide-vue-next'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '~/features/auth/authStore'
import { showConfirm } from '~/helpers/toolsHelper'

const NAV_ITEMS = [
  { to: '/', label: 'Beranda' },
  { to: '/users', label: 'Pengguna' },
  { to: '/profile', label: 'Profil' },
]

const router = useRouter()
const auth = useAuthStore()

const onLogout = async (): Promise<void> => {
  const confirmed = await showConfirm({
    title: 'Keluar dari akun?',
    text: 'Anda perlu masuk lagi untuk melihat catatan arus kas.',
    confirmText: 'Keluar',
  })
  if (!confirmed) return

  await auth.logout()
  await router.push('/auth/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <a
      href="#konten"
      class="sr-only rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
    >
      Lewati ke konten
    </a>

    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <RouterLink to="/" class="flex items-center gap-2.5 font-extrabold text-slate-900">
          <span
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"
          >
            <Wallet class="h-5 w-5" aria-hidden="true" />
          </span>
          Delcom Cash Flow
        </RouterLink>

        <nav aria-label="Navigasi utama" class="order-last flex w-full gap-1 sm:order-none sm:w-auto">
          <RouterLink
            v-for="item in NAV_ITEMS"
            :key="item.to"
            :to="item.to"
            exact-active-class="bg-brand-50 text-brand-700"
            class="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <button
          type="button"
          :disabled="auth.loading"
          class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:opacity-60"
          @click="onLogout"
        >
          <LogOut class="h-4 w-4" aria-hidden="true" />
          Keluar
        </button>
      </div>
    </header>

    <main id="konten" tabindex="-1" class="mx-auto max-w-5xl px-4 py-8 focus:outline-none">
      <RouterView />
    </main>
  </div>
</template>
