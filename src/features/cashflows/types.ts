export type CashFlowType = 'inflow' | 'outflow'
export type CashFlowSource = 'cash' | 'savings' | 'loans'

export interface CashFlow {
  id: number
  user_id: number
  type: CashFlowType
  source: CashFlowSource
  label: string
  description: string
  nominal: number
  created_at: string
  updated_at: string
}

/**
 * Statistik ringkasan dari GET /cash-flows. Kuncinya dinamis
 * (total_inflow, total_outflow_cash, total_outflow_label_gaji, ...),
 * dan bisa kosong saat belum ada transaksi.
 */
export type CashFlowStats = Record<string, number>

export interface CashFlowPayload {
  type: CashFlowType
  source: CashFlowSource
  label: string
  description: string
  nominal: number
}

/** Nilai string kosong berarti "semua" (filter tidak aktif) */
export interface CashFlowFilters {
  type: CashFlowType | ''
  source: CashFlowSource | ''
  label: string
  /** Format input tanggal browser: YYYY-MM-DD */
  start_date: string
  end_date: string
}

export type StatsQuery = {
  /** Format API: YYYY-MM-DD HH:mm:ss */
  end_date?: string
  total_data?: number
}

/** Kunci periode: "05-10-2024" (harian) atau "10-2024" (bulanan) */
export interface PeriodStats {
  stats_inflow: Record<string, number>
  stats_outflow: Record<string, number>
  stats_cashflow: Record<string, number>
}

export interface CashFlowsData {
  cash_flows: CashFlow[]
  stats: CashFlowStats
}

export interface CashFlowData {
  cash_flow: CashFlow
}

export interface CashFlowCreatedData {
  cash_flow_id: number
}

export interface LabelsData {
  labels: string[]
}
