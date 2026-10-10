import type {
  CashFlowCreatedData,
  CashFlowData,
  CashFlowPayload,
  CashFlowsData,
  LabelsData,
  PeriodStats,
  StatsQuery,
} from '~/features/cashflows/types'
import { api } from '~/helpers/apiHelper'
import type { QueryValue } from '~/helpers/apiHelper'

export const cashflowsApi = {
  getAll: (query?: Record<string, QueryValue>) => api.get<CashFlowsData>('/cash-flows', query),
  getById: (id: number) => api.get<CashFlowData>(`/cash-flows/${id}`),
  create: (payload: CashFlowPayload) =>
    api.post<CashFlowCreatedData>('/cash-flows', payload),
  update: (id: number, payload: CashFlowPayload) =>
    api.put<undefined>(`/cash-flows/${id}`, payload),
  remove: (id: number) => api.delete<undefined>(`/cash-flows/${id}`),
  removeAll: () => api.delete<undefined>('/cash-flows'),
  getLabels: () => api.get<LabelsData>('/cash-flows/labels'),
  getDailyStats: (query?: StatsQuery) =>
    api.get<PeriodStats>('/cash-flows/stats/daily', query),
  getMonthlyStats: (query?: StatsQuery) =>
    api.get<PeriodStats>('/cash-flows/stats/monthly', query),
}
