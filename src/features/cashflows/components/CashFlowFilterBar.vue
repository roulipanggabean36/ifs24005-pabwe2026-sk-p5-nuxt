<script setup lang="ts">
import { FilterX } from 'lucide-vue-next'
import { computed } from 'vue'
import { hasActiveFilters } from '~/features/cashflows/cashflowHelper'
import { SOURCE_OPTIONS, TYPE_OPTIONS } from '~/features/cashflows/constants'
import type { CashFlowFilters } from '~/features/cashflows/types'

const props = defineProps<{
  modelValue: CashFlowFilters
  labels: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CashFlowFilters]
  reset: []
}>()

const FIELD_CLASS =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30'
const LABEL_CLASS = 'mb-1 block text-xs font-semibold text-slate-600'

const isActive = computed(() => hasActiveFilters(props.modelValue))

const update = (key: keyof CashFlowFilters, event: Event): void => {
  const { value } = event.target as HTMLInputElement | HTMLSelectElement
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<template>
  <form
    class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    aria-label="Filter transaksi"
    @submit.prevent
  >
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div>
        <label for="filter-type" :class="LABEL_CLASS">Jenis</label>
        <select
          id="filter-type"
          :value="modelValue.type"
          :class="FIELD_CLASS"
          @change="update('type', $event)"
        >
          <option value="">Semua jenis</option>
          <option v-for="option in TYPE_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div>
        <label for="filter-source" :class="LABEL_CLASS">Sumber dana</label>
        <select
          id="filter-source"
          :value="modelValue.source"
          :class="FIELD_CLASS"
          @change="update('source', $event)"
        >
          <option value="">Semua sumber</option>
          <option v-for="option in SOURCE_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div>
        <label for="filter-label" :class="LABEL_CLASS">Label</label>
        <select
          id="filter-label"
          :value="modelValue.label"
          :class="FIELD_CLASS"
          @change="update('label', $event)"
        >
          <option value="">Semua label</option>
          <option v-for="label in labels" :key="label" :value="label">{{ label }}</option>
        </select>
      </div>

      <div>
        <label for="filter-start" :class="LABEL_CLASS">Dari tanggal</label>
        <input
          id="filter-start"
          type="date"
          :value="modelValue.start_date"
          :class="FIELD_CLASS"
          @input="update('start_date', $event)"
        />
      </div>

      <div>
        <label for="filter-end" :class="LABEL_CLASS">Sampai tanggal</label>
        <input
          id="filter-end"
          type="date"
          :value="modelValue.end_date"
          :class="FIELD_CLASS"
          @input="update('end_date', $event)"
        />
      </div>
    </div>

    <button
      v-if="isActive"
      type="button"
      class="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      @click="emit('reset')"
    >
      <FilterX class="h-4 w-4" aria-hidden="true" />
      Hapus filter
    </button>
  </form>
</template>
