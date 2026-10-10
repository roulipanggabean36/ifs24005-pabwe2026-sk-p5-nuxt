import type { CashFlowFilters, CashFlowSource, CashFlowType } from '~/features/cashflows/types'

export const TYPE_LABELS: Record<CashFlowType, string> = {
  inflow: 'Pemasukan',
  outflow: 'Pengeluaran',
}

export const SOURCE_LABELS: Record<CashFlowSource, string> = {
  cash: 'Tunai',
  savings: 'Tabungan',
  loans: 'Pinjaman',
}

export const TYPE_OPTIONS = (Object.keys(TYPE_LABELS) as CashFlowType[]).map((value) => ({
  value,
  label: TYPE_LABELS[value],
}))

export const SOURCE_OPTIONS = (Object.keys(SOURCE_LABELS) as CashFlowSource[]).map((value) => ({
  value,
  label: SOURCE_LABELS[value],
}))

export const EMPTY_FILTERS: CashFlowFilters = {
  type: '',
  source: '',
  label: '',
  start_date: '',
  end_date: '',
}
