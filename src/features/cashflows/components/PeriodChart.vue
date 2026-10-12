<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '~/helpers/toolsHelper'

const props = defineProps<{
  title: string
  inflow: Record<string, number>
  outflow: Record<string, number>
}>()

const periods = computed(() =>
  Object.entries(props.inflow).map(([period, inflowValue]) => ({
    period,
    inflow: inflowValue,
    outflow: props.outflow[period] ?? 0,
  })),
)

const maxValue = computed(() =>
  Math.max(0, ...periods.value.flatMap((item) => [item.inflow, item.outflow])),
)

const barHeight = (value: number): number =>
  maxValue.value === 0 ? 0 : Math.round((value / maxValue.value) * 100)

const summary = (item: { inflow: number; outflow: number }): string =>
  `Pemasukan ${formatCurrency(item.inflow)}, pengeluaran ${formatCurrency(item.outflow)}`
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-base font-bold text-slate-900">{{ title }}</h2>
      <div class="flex items-center gap-4 text-xs text-slate-600">
        <span class="flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-full bg-income" aria-hidden="true" />
          Pemasukan
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-full bg-expense" aria-hidden="true" />
          Pengeluaran
        </span>
      </div>
    </div>

    <p v-if="periods.length === 0" class="py-8 text-center text-sm text-slate-600">
      Belum ada data statistik untuk ditampilkan.
    </p>

    <ul v-else class="mt-4 flex gap-2 overflow-x-auto">
      <li
        v-for="item in periods"
        :key="item.period"
        class="flex min-w-12 flex-1 flex-col items-center gap-1.5"
        :title="summary(item)"
      >
        <div class="flex h-32 w-full items-end justify-center gap-1">
          <div
            data-testid="bar-inflow"
            class="w-3 rounded-t bg-income"
            :style="{ height: `${barHeight(item.inflow)}%` }"
          />
          <div
            data-testid="bar-outflow"
            class="w-3 rounded-t bg-expense"
            :style="{ height: `${barHeight(item.outflow)}%` }"
          />
        </div>
        <span class="text-[11px] text-slate-600">{{ item.period }}</span>
        <span class="sr-only">{{ summary(item) }}</span>
      </li>
    </ul>
  </section>
</template>
