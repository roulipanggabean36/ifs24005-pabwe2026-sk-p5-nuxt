import type { CashFlowFilters, CashFlowStats } from '~/features/cashflows/types'

/** Mengambil satu angka statistik; 0 saat kuncinya belum ada (mis. belum ada transaksi) */
export const getStat = (stats: CashFlowStats, key: string): number => stats[key] ?? 0

export const hasActiveFilters = (filters: CashFlowFilters): boolean =>
  Object.values(filters).some((value) => value.trim() !== '')

/**
 * Mengubah filter UI menjadi query API. Nilai kosong ikut dikirim sebagai string kosong
 * karena buildUrl() di apiHelper otomatis membuangnya dari URL.
 */
export const toApiQuery = (filters: CashFlowFilters): Record<string, string> => ({
  type: filters.type,
  source: filters.source,
  label: filters.label.trim(),
  start_date: filters.start_date ? `${filters.start_date} 00:00:00` : '',
  end_date: filters.end_date ? `${filters.end_date} 23:59:59` : '',
})
