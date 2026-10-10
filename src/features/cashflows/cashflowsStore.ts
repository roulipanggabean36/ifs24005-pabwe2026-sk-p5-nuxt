import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getStat, hasActiveFilters, toApiQuery } from '~/features/cashflows/cashflowHelper'
import { cashflowsApi } from '~/features/cashflows/cashflowsApi'
import { EMPTY_FILTERS } from '~/features/cashflows/constants'
import type {
  CashFlow,
  CashFlowFilters,
  CashFlowPayload,
  CashFlowStats,
  PeriodStats,
  StatsQuery,
} from '~/features/cashflows/types'

export const useCashFlowsStore = defineStore('cashflows', () => {
  const cashFlows = ref<CashFlow[]>([])
  const stats = ref<CashFlowStats>({})
  const filters = ref<CashFlowFilters>({ ...EMPTY_FILTERS })
  const selected = ref<CashFlow | null>(null)
  const labels = ref<string[]>([])
  const dailyStats = ref<PeriodStats | null>(null)
  const monthlyStats = ref<PeriodStats | null>(null)
  /** true saat memuat daftar atau detail transaksi */
  const loading = ref(false)
  /** true saat menambah, mengubah, atau menghapus transaksi */
  const saving = ref(false)

  const totalInflow = computed(() => getStat(stats.value, 'total_inflow'))
  const totalOutflow = computed(() => getStat(stats.value, 'total_outflow'))
  const balance = computed(() => totalInflow.value - totalOutflow.value)
  const isFiltered = computed(() => hasActiveFilters(filters.value))

  const setFilters = (next: CashFlowFilters): void => {
    filters.value = { ...next }
  }

  const resetFilters = (): void => {
    filters.value = { ...EMPTY_FILTERS }
  }

  const fetchCashFlows = async (): Promise<void> => {
    loading.value = true
    try {
      const response = await cashflowsApi.getAll(toApiQuery(filters.value))
      cashFlows.value = response.data.cash_flows
      stats.value = response.data.stats
    } finally {
      loading.value = false
    }
  }

  const fetchCashFlow = async (id: number): Promise<CashFlow> => {
    loading.value = true
    try {
      const response = await cashflowsApi.getById(id)
      selected.value = response.data.cash_flow
      return response.data.cash_flow
    } finally {
      loading.value = false
    }
  }

  const fetchLabels = async (): Promise<void> => {
    const response = await cashflowsApi.getLabels()
    labels.value = response.data.labels
  }

  const fetchDailyStats = async (query?: StatsQuery): Promise<void> => {
    const response = await cashflowsApi.getDailyStats(query)
    dailyStats.value = response.data
  }

  const fetchMonthlyStats = async (query?: StatsQuery): Promise<void> => {
    const response = await cashflowsApi.getMonthlyStats(query)
    monthlyStats.value = response.data
  }

  /** Mengembalikan id transaksi baru. Pemanggil bertugas memuat ulang daftar. */
  const createCashFlow = async (payload: CashFlowPayload): Promise<number> => {
    saving.value = true
    try {
      const response = await cashflowsApi.create(payload)
      return response.data.cash_flow_id
    } finally {
      saving.value = false
    }
  }

  const updateCashFlow = async (id: number, payload: CashFlowPayload): Promise<void> => {
    saving.value = true
    try {
      await cashflowsApi.update(id, payload)
    } finally {
      saving.value = false
    }
  }

  const deleteCashFlow = async (id: number): Promise<void> => {
    saving.value = true
    try {
      await cashflowsApi.remove(id)
    } finally {
      saving.value = false
    }
  }

  const deleteAllCashFlows = async (): Promise<void> => {
    saving.value = true
    try {
      await cashflowsApi.removeAll()
    } finally {
      saving.value = false
    }
  }

  return {
    cashFlows,
    stats,
    filters,
    selected,
    labels,
    dailyStats,
    monthlyStats,
    loading,
    saving,
    totalInflow,
    totalOutflow,
    balance,
    isFiltered,
    setFilters,
    resetFilters,
    fetchCashFlows,
    fetchCashFlow,
    fetchLabels,
    fetchDailyStats,
    fetchMonthlyStats,
    createCashFlow,
    updateCashFlow,
    deleteCashFlow,
    deleteAllCashFlows,
  }
})
