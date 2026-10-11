<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import CashFlowFilterBar from '~/features/cashflows/components/CashFlowFilterBar.vue'
import CashFlowList from '~/features/cashflows/components/CashFlowList.vue'
import PeriodChart from '~/features/cashflows/components/PeriodChart.vue'
import SummaryCards from '~/features/cashflows/components/SummaryCards.vue'
import { useCashFlowsStore } from '~/features/cashflows/cashflowsStore'
import CashFlowFormModal from '~/features/cashflows/modals/CashFlowFormModal.vue'
import type { CashFlow, CashFlowFilters, CashFlowPayload } from '~/features/cashflows/types'
import { getErrorMessage, showConfirm, showError, showSuccess } from '~/helpers/toolsHelper'

const DAILY_PERIODS = 7
const MONTHLY_PERIODS = 6

const store = useCashFlowsStore()

const modalOpen = ref(false)
/** Transaksi yang sedang diubah; null berarti form menambah transaksi baru */
const editing = ref<CashFlow | null>(null)

const loadAll = async (): Promise<void> => {
  try {
    await Promise.all([
      store.fetchCashFlows(),
      store.fetchLabels(),
      store.fetchDailyStats({ total_data: DAILY_PERIODS }),
      store.fetchMonthlyStats({ total_data: MONTHLY_PERIODS }),
    ])
  } catch (error) {
    await showError(getErrorMessage(error))
  }
}

const reloadList = async (): Promise<void> => {
  try {
    await store.fetchCashFlows()
  } catch (error) {
    await showError(getErrorMessage(error))
  }
}

onMounted(loadAll)

const onFilterChange = async (next: CashFlowFilters): Promise<void> => {
  store.setFilters(next)
  await reloadList()
}

const onFilterReset = async (): Promise<void> => {
  store.resetFilters()
  await reloadList()
}

const openCreate = (): void => {
  editing.value = null
  modalOpen.value = true
}

const openEdit = (item: CashFlow): void => {
  editing.value = item
  modalOpen.value = true
}

const closeModal = (): void => {
  modalOpen.value = false
}

const onSubmit = async (payload: CashFlowPayload): Promise<void> => {
  const current = editing.value
  try {
    if (current) {
      await store.updateCashFlow(current.id, payload)
      void showSuccess('Transaksi berhasil diperbarui.')
    } else {
      await store.createCashFlow(payload)
      void showSuccess('Transaksi berhasil ditambahkan.')
    }
    closeModal()
    await loadAll()
  } catch (error) {
    await showError(getErrorMessage(error))
  }
}

const onDelete = async (item: CashFlow): Promise<void> => {
  const confirmed = await showConfirm({
    title: 'Hapus transaksi?',
    text: `Transaksi "${item.label}" akan dihapus permanen.`,
    confirmText: 'Hapus',
  })
  if (!confirmed) return

  try {
    await store.deleteCashFlow(item.id)
    void showSuccess('Transaksi berhasil dihapus.')
    await loadAll()
  } catch (error) {
    await showError(getErrorMessage(error))
  }
}

const onDeleteAll = async (): Promise<void> => {
  const confirmed = await showConfirm({
    title: 'Hapus semua transaksi?',
    text: 'Semua catatan arus kas Anda akan dihapus permanen dan tidak bisa dikembalikan.',
    confirmText: 'Hapus semua',
  })
  if (!confirmed) return

  try {
    await store.deleteAllCashFlows()
    void showSuccess('Semua transaksi berhasil dihapus.')
    await loadAll()
  } catch (error) {
    await showError(getErrorMessage(error))
  }
}
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">Arus kas</h1>
        <p class="mt-1 text-sm text-slate-600">Pantau pemasukan, pengeluaran, dan saldo Anda.</p>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          :disabled="store.saving"
          class="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-expense transition hover:bg-expense/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-expense/40 disabled:opacity-60"
          @click="onDeleteAll"
        >
          <Trash2 class="h-4 w-4" aria-hidden="true" />
          Hapus semua
        </button>
        <button
          type="button"
          class="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          @click="openCreate"
        >
          <Plus class="h-4 w-4" aria-hidden="true" />
          Tambah transaksi
        </button>
      </div>
    </header>

    <SummaryCards
      :balance="store.balance"
      :total-inflow="store.totalInflow"
      :total-outflow="store.totalOutflow"
    />

    <div class="grid gap-4 lg:grid-cols-2">
      <PeriodChart
        v-if="store.dailyStats"
        title="Arus kas harian"
        :inflow="store.dailyStats.stats_inflow"
        :outflow="store.dailyStats.stats_outflow"
      />
      <PeriodChart
        v-if="store.monthlyStats"
        title="Arus kas bulanan"
        :inflow="store.monthlyStats.stats_inflow"
        :outflow="store.monthlyStats.stats_outflow"
      />
    </div>

    <CashFlowFilterBar
      :model-value="store.filters"
      :labels="store.labels"
      @update:model-value="onFilterChange"
      @reset="onFilterReset"
    />

    <p v-if="store.loading" role="status" class="py-10 text-center text-sm text-slate-600">
      Memuat transaksi...
    </p>
    <CashFlowList v-else :cash-flows="store.cashFlows" @edit="openEdit" @delete="onDelete" />

    <CashFlowFormModal
      :open="modalOpen"
      :cash-flow="editing"
      :labels="store.labels"
      :saving="store.saving"
      @close="closeModal"
      @submit="onSubmit"
    />
  </section>
</template>
