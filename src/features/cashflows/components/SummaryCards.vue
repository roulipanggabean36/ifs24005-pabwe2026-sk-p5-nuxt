<script setup lang="ts">
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-vue-next'
import { formatCurrency } from '~/helpers/toolsHelper'

defineProps<{
  balance: number
  totalInflow: number
  totalOutflow: number
}>()
</script>

<template>
  <dl class="grid gap-4 sm:grid-cols-3">
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <dt class="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Wallet class="h-4 w-4" aria-hidden="true" />
        Saldo
      </dt>
      <dd
        data-testid="balance"
        class="mt-2 text-2xl font-extrabold"
        :class="balance < 0 ? 'text-expense' : 'text-slate-900'"
      >
        {{ formatCurrency(balance) }}
      </dd>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <dt class="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <ArrowUpRight class="h-4 w-4 text-income" aria-hidden="true" />
        Pemasukan
      </dt>
      <dd data-testid="inflow" class="mt-2 text-2xl font-extrabold text-income">
        {{ formatCurrency(totalInflow) }}
      </dd>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <dt class="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <ArrowDownLeft class="h-4 w-4 text-expense" aria-hidden="true" />
        Pengeluaran
      </dt>
      <dd data-testid="outflow" class="mt-2 text-2xl font-extrabold text-expense">
        {{ formatCurrency(totalOutflow) }}
      </dd>
    </div>
  </dl>
</template>
