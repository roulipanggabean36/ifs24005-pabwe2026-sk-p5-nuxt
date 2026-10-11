<script setup lang="ts">
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Pencil, Trash2 } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { SOURCE_LABELS, TYPE_LABELS } from '~/features/cashflows/constants'
import { useCashFlowsStore } from '~/features/cashflows/cashflowsStore'
import CashFlowFormModal from '~/features/cashflows/modals/CashFlowFormModal.vue'
import type { CashFlowPayload } from '~/features/cashflows/types'
import {
  formatCurrency,
  formatDate,
  getErrorMessage,
  showConfirm,
  showError,
  showSuccess,
} from '~/helpers/toolsHelper'

const route = useRoute()
const router = useRouter()
const store = useCashFlowsStore()

const id = Number(route.params.id)
const errorMessage = ref('')
const editOpen = ref(false)

// Data transaksi sebelumnya dibuang agar tidak sempat tampil sebelum data baru termuat
store.selected = null

onMounted(async () => {
  try {
    await Promise.all([store.fetchCashFlow(id), store.fetchLabels()])
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
})

const onSubmit = async (payload: CashFlowPayload): Promise<void> => {
  try {
    await store.updateCashFlow(id, payload)
    editOpen.value = false
    void showSuccess('Transaksi berhasil diperbarui.')
    await store.fetchCashFlow(id)
  } catch (error) {
    await showError(getErrorMessage(error))
  }
}

const onDelete = async (): Promise<void> => {
  const confirmed = await showConfirm({
    title: 'Hapus transaksi?',
    text: 'Transaksi ini akan dihapus permanen.',
    confirmText: 'Hapus',
  })
  if (!confirmed) return

  try {
    await store.deleteCashFlow(id)
    void showSuccess('Transaksi berhasil dihapus.')
    await router.push('/')
  } catch (error) {
    await showError(getErrorMessage(error))
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-2xl space-y-5">
    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
    >
      <ArrowLeft class="h-4 w-4" aria-hidden="true" />
      Kembali ke beranda
    </RouterLink>

    <p v-if="store.loading" role="status" class="py-10 text-center text-sm text-slate-500">
      Memuat transaksi...
    </p>

    <div
      v-else-if="errorMessage"
      role="alert"
      class="rounded-2xl border border-expense/30 bg-expense/5 p-6"
    >
      <p class="font-semibold text-expense">Transaksi tidak dapat dimuat</p>
      <p class="mt-1 text-sm text-slate-600">{{ errorMessage }}</p>
    </div>

    <article
      v-else-if="store.selected"
      class="rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div class="flex items-center gap-4 border-b border-slate-100 p-6">
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          :class="
            store.selected.type === 'inflow'
              ? 'bg-income/10 text-income'
              : 'bg-expense/10 text-expense'
          "
        >
          <ArrowUpRight v-if="store.selected.type === 'inflow'" class="h-6 w-6" aria-hidden="true" />
          <ArrowDownLeft v-else class="h-6 w-6" aria-hidden="true" />
        </span>

        <div class="min-w-0 flex-1">
          <h1 class="truncate text-xl font-extrabold text-slate-900">{{ store.selected.label }}</h1>
          <p class="text-sm text-slate-500">{{ TYPE_LABELS[store.selected.type] }}</p>
        </div>

        <p
          data-testid="nominal"
          class="text-xl font-extrabold"
          :class="store.selected.type === 'inflow' ? 'text-income' : 'text-expense'"
        >
          {{ store.selected.type === 'inflow' ? '+' : '-' }}{{ formatCurrency(store.selected.nominal) }}
        </p>
      </div>

      <dl class="grid gap-5 p-6 sm:grid-cols-2">
        <div>
          <dt class="text-xs font-semibold text-slate-500">Sumber dana</dt>
          <dd class="mt-1 text-sm font-medium text-slate-900">
            {{ SOURCE_LABELS[store.selected.source] }}
          </dd>
        </div>
        <div>
          <dt class="text-xs font-semibold text-slate-500">Dicatat pada</dt>
          <dd class="mt-1 text-sm font-medium text-slate-900">
            {{ formatDate(store.selected.created_at) }}
          </dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-xs font-semibold text-slate-500">Deskripsi</dt>
          <dd class="mt-1 text-sm text-slate-900">{{ store.selected.description }}</dd>
        </div>
        <div>
          <dt class="text-xs font-semibold text-slate-500">Terakhir diubah</dt>
          <dd class="mt-1 text-sm font-medium text-slate-900">
            {{ formatDate(store.selected.updated_at) }}
          </dd>
        </div>
      </dl>

      <div class="flex justify-end gap-3 border-t border-slate-100 p-4">
        <button
          type="button"
          :disabled="store.saving"
          class="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-expense transition hover:bg-expense/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-expense/40 disabled:opacity-60"
          @click="onDelete"
        >
          <Trash2 class="h-4 w-4" aria-hidden="true" />
          Hapus
        </button>
        <button
          type="button"
          class="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          @click="editOpen = true"
        >
          <Pencil class="h-4 w-4" aria-hidden="true" />
          Ubah
        </button>
      </div>
    </article>

    <CashFlowFormModal
      :open="editOpen"
      :cash-flow="store.selected"
      :labels="store.labels"
      :saving="store.saving"
      @close="editOpen = false"
      @submit="onSubmit"
    />
  </section>
</template>
