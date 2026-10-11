<script setup lang="ts">
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { SOURCE_LABELS } from '~/features/cashflows/constants'
import type { CashFlow } from '~/features/cashflows/types'
import { formatCurrency, formatDate } from '~/helpers/toolsHelper'

defineProps<{
  cashFlows: CashFlow[]
}>()

const emit = defineEmits<{
  edit: [cashFlow: CashFlow]
  delete: [cashFlow: CashFlow]
}>()

const isInflow = (cashFlow: CashFlow): boolean => cashFlow.type === 'inflow'
</script>

<template>
  <p
    v-if="cashFlows.length === 0"
    class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-600"
  >
    Belum ada transaksi. Tambahkan transaksi pertama untuk mulai mencatat arus kas.
  </p>

  <ul
    v-else
    class="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm"
  >
    <li v-for="item in cashFlows" :key="item.id" class="flex items-start gap-4 p-4">
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        :class="isInflow(item) ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'"
      >
        <ArrowUpRight v-if="isInflow(item)" class="h-5 w-5" aria-hidden="true" />
        <ArrowDownLeft v-else class="h-5 w-5" aria-hidden="true" />
      </span>

      <div class="min-w-0 flex-1">
        <RouterLink
          :to="`/cash-flows/${item.id}`"
          class="font-semibold text-slate-900 hover:text-brand-600"
        >
          {{ item.label }}
        </RouterLink>
        <p class="truncate text-sm text-slate-600">{{ item.description }}</p>
        <div class="mt-1.5 flex flex-wrap items-center gap-2">
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {{ SOURCE_LABELS[item.source] }}
          </span>
          <time :datetime="item.created_at" class="text-xs text-slate-600">
            {{ formatDate(item.created_at) }}
          </time>
        </div>
      </div>

      <div class="flex shrink-0 flex-col items-end gap-2">
        <p
          data-testid="nominal"
          class="text-sm font-bold"
          :class="isInflow(item) ? 'text-income' : 'text-expense'"
        >
          {{ isInflow(item) ? '+' : '-' }}{{ formatCurrency(item.nominal) }}
        </p>
        <div class="flex gap-1">
          <button
            type="button"
            :aria-label="`Ubah transaksi ${item.label}`"
            class="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            @click="emit('edit', item)"
          >
            <Pencil class="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            :aria-label="`Hapus transaksi ${item.label}`"
            class="rounded-lg p-2 text-slate-600 transition hover:bg-expense/10 hover:text-expense focus:outline-none focus-visible:ring-2 focus-visible:ring-expense/40"
            @click="emit('delete', item)"
          >
            <Trash2 class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  </ul>
</template>
