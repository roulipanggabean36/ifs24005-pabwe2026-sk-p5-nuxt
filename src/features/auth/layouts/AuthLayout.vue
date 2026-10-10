<script setup lang="ts">
import { Wallet } from 'lucide-vue-next'

defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-brand-50 px-4 py-10">
    <div class="w-full max-w-md">
      <div class="mb-8 flex flex-col items-center text-center">
        <div
          class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg"
        >
          <Wallet class="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 class="text-2xl font-extrabold text-slate-900">{{ title }}</h1>
        <p v-if="subtitle" class="mt-2 text-sm text-slate-500">{{ subtitle }}</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <slot />
      </div>

      <p class="mt-6 text-center text-xs text-slate-400">Delcom Cash Flow</p>
    </div>
  </main>
</template>
