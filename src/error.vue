<script setup lang="ts">
import { computed } from 'vue'

const NOT_FOUND = 404

// Cukup sebagian bentuk NuxtError yang dipakai halaman ini
const props = defineProps<{
  error: { statusCode: number; message: string }
}>()

const isNotFound = computed(() => props.error.statusCode === NOT_FOUND)

const title = computed(() => (isNotFound.value ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan'))

const description = computed(() =>
  isNotFound.value
    ? 'Alamat yang Anda buka tidak ada atau sudah dipindahkan.'
    : props.error.message,
)
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-md text-center">
      <p class="text-6xl font-extrabold text-brand-600">{{ error.statusCode }}</p>
      <h1 class="mt-4 text-2xl font-extrabold text-slate-900">{{ title }}</h1>
      <p class="mt-2 text-sm text-slate-500">{{ description }}</p>

      <!-- Tautan biasa (muat ulang penuh) sekaligus membersihkan status error Nuxt -->
      <a
        href="/"
        class="mt-8 inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        Kembali ke beranda
      </a>
    </div>
  </main>
</template>
