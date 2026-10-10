<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { nextTick, ref, useId, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()

const titleId = `modal-title-${useId()}`
const panel = ref<HTMLElement | null>(null)

// Fokus dipindahkan ke dialog saat dibuka agar pembaca layar langsung membacakan judulnya
// dan tombol Escape langsung berfungsi
watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await nextTick()
    panel.value!.focus()
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
    @click.self="emit('close')"
  >
    <div
      ref="panel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
      class="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl focus:outline-none"
      @keydown.esc="emit('close')"
    >
      <header class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 :id="titleId" class="text-lg font-bold text-slate-900">{{ title }}</h2>
        <button
          type="button"
          aria-label="Tutup"
          class="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          @click="emit('close')"
        >
          <X class="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div class="px-6 py-5">
        <slot />
      </div>
    </div>
  </div>
</template>
