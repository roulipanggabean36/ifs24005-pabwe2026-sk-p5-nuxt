import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cashflowsApi } from '~/features/cashflows/cashflowsApi'
import { useCashFlowsStore } from '~/features/cashflows/cashflowsStore'
import { EMPTY_FILTERS } from '~/features/cashflows/constants'
import type {
  CashFlow,
  CashFlowCreatedData,
  CashFlowData,
  CashFlowPayload,
  CashFlowsData,
  LabelsData,
  PeriodStats,
} from '~/features/cashflows/types'
import type { ApiResponse } from '~/helpers/apiHelper'

vi.mock('~/features/cashflows/cashflowsApi', () => ({
  cashflowsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    removeAll: vi.fn(),
    getLabels: vi.fn(),
    getDailyStats: vi.fn(),
    getMonthlyStats: vi.fn(),
  },
}))

const api = vi.mocked(cashflowsApi)

const gaji: CashFlow = {
  id: 2,
  user_id: 1,
  type: 'inflow',
  source: 'cash',
  label: 'gaji',
  description: 'Gaji bulanan',
  nominal: 2500000,
  created_at: '2026-10-05T11:26:45.000000Z',
  updated_at: '2026-10-05T11:26:48.000000Z',
}

const keyboard: CashFlow = {
  ...gaji,
  id: 4,
  type: 'outflow',
  source: 'savings',
  label: 'alat-elektronik',
  nominal: 400000,
}

const payload: CashFlowPayload = {
  type: 'outflow',
  source: 'savings',
  label: 'alat-elektronik',
  description: 'Keyboard dan mouse',
  nominal: 400000,
}

const periodStats: PeriodStats = {
  stats_inflow: { '05-10-2026': 2500000 },
  stats_outflow: { '05-10-2026': 400000 },
  stats_cashflow: { '05-10-2026': 2100000 },
}

const ok = <T>(data: T): ApiResponse<T> => ({ status: 'success', message: 'OK', data })

describe('cashflowsStore', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
  })

  it('memiliki state awal kosong', () => {
    const store = useCashFlowsStore()

    expect(store.cashFlows).toEqual([])
    expect(store.stats).toEqual({})
    expect(store.filters).toEqual(EMPTY_FILTERS)
    expect(store.selected).toBeNull()
    expect(store.labels).toEqual([])
    expect(store.dailyStats).toBeNull()
    expect(store.monthlyStats).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.saving).toBe(false)
    expect(store.totalInflow).toBe(0)
    expect(store.totalOutflow).toBe(0)
    expect(store.balance).toBe(0)
    expect(store.isFiltered).toBe(false)
  })

  describe('filter', () => {
    it('setFilters menyimpan salinan filter dan mengaktifkan isFiltered', () => {
      const store = useCashFlowsStore()
      const next: typeof EMPTY_FILTERS = { ...EMPTY_FILTERS, type: 'inflow' }

      store.setFilters(next)
      next.type = 'outflow'

      expect(store.filters.type).toBe('inflow')
      expect(store.isFiltered).toBe(true)
    })

    it('resetFilters mengosongkan semua filter', () => {
      const store = useCashFlowsStore()
      store.setFilters({ ...EMPTY_FILTERS, label: 'gaji' })

      store.resetFilters()

      expect(store.filters).toEqual(EMPTY_FILTERS)
      expect(store.isFiltered).toBe(false)
    })
  })

  describe('fetchCashFlows', () => {
    const data: CashFlowsData = {
      cash_flows: [keyboard, gaji],
      stats: { total_inflow: 2500000, total_outflow: 400000 },
    }

    it('mengisi daftar, statistik, dan total tanpa filter', async () => {
      api.getAll.mockResolvedValue(ok(data))
      const store = useCashFlowsStore()

      await store.fetchCashFlows()

      expect(api.getAll).toHaveBeenCalledWith({
        type: '',
        source: '',
        label: '',
        start_date: '',
        end_date: '',
      })
      expect(store.cashFlows).toEqual([keyboard, gaji])
      expect(store.totalInflow).toBe(2500000)
      expect(store.totalOutflow).toBe(400000)
      expect(store.balance).toBe(2100000)
      expect(store.loading).toBe(false)
    })

    it('mengirim filter aktif sebagai query API', async () => {
      api.getAll.mockResolvedValue(ok(data))
      const store = useCashFlowsStore()
      store.setFilters({
        type: 'outflow',
        source: 'savings',
        label: 'alat-elektronik',
        start_date: '2026-10-01',
        end_date: '2026-10-31',
      })

      await store.fetchCashFlows()

      expect(api.getAll).toHaveBeenCalledWith({
        type: 'outflow',
        source: 'savings',
        label: 'alat-elektronik',
        start_date: '2026-10-01 00:00:00',
        end_date: '2026-10-31 23:59:59',
      })
    })

    it('loading bernilai true selama request berjalan', async () => {
      let resolve!: (value: ApiResponse<CashFlowsData>) => void
      api.getAll.mockReturnValue(new Promise((r) => { resolve = r }))
      const store = useCashFlowsStore()

      const pending = store.fetchCashFlows()
      expect(store.loading).toBe(true)

      resolve(ok(data))
      await pending
      expect(store.loading).toBe(false)
    })

    it('melempar ulang error dan mengembalikan loading ke false', async () => {
      api.getAll.mockRejectedValue(new Error('Unauthenticated.'))
      const store = useCashFlowsStore()

      await expect(store.fetchCashFlows()).rejects.toThrow('Unauthenticated.')
      expect(store.loading).toBe(false)
      expect(store.cashFlows).toEqual([])
    })

    it('saldo menjadi negatif saat pengeluaran lebih besar', async () => {
      api.getAll.mockResolvedValue(
        ok<CashFlowsData>({ cash_flows: [], stats: { total_inflow: 100, total_outflow: 300 } }),
      )
      const store = useCashFlowsStore()

      await store.fetchCashFlows()

      expect(store.balance).toBe(-200)
    })
  })

  describe('fetchCashFlow', () => {
    it('menyimpan dan mengembalikan transaksi terpilih', async () => {
      api.getById.mockResolvedValue(ok<CashFlowData>({ cash_flow: keyboard }))
      const store = useCashFlowsStore()

      await expect(store.fetchCashFlow(4)).resolves.toEqual(keyboard)

      expect(api.getById).toHaveBeenCalledWith(4)
      expect(store.selected).toEqual(keyboard)
      expect(store.loading).toBe(false)
    })

    it('melempar ulang error dan mengembalikan loading ke false', async () => {
      api.getById.mockRejectedValue(new Error('Data tidak ditemukan'))
      const store = useCashFlowsStore()

      await expect(store.fetchCashFlow(99)).rejects.toThrow('Data tidak ditemukan')
      expect(store.selected).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchLabels', () => {
    it('mengisi daftar label', async () => {
      api.getLabels.mockResolvedValue(ok<LabelsData>({ labels: ['gaji', 'alat-mandi'] }))
      const store = useCashFlowsStore()

      await store.fetchLabels()

      expect(store.labels).toEqual(['gaji', 'alat-mandi'])
    })
  })

  describe('statistik periode', () => {
    it('fetchDailyStats menyimpan statistik harian dengan query', async () => {
      api.getDailyStats.mockResolvedValue(ok(periodStats))
      const store = useCashFlowsStore()
      const query = { total_data: 7 }

      await store.fetchDailyStats(query)

      expect(api.getDailyStats).toHaveBeenCalledWith(query)
      expect(store.dailyStats).toEqual(periodStats)
    })

    it('fetchDailyStats berjalan tanpa query', async () => {
      api.getDailyStats.mockResolvedValue(ok(periodStats))
      const store = useCashFlowsStore()

      await store.fetchDailyStats()

      expect(api.getDailyStats).toHaveBeenCalledWith(undefined)
    })

    it('fetchMonthlyStats menyimpan statistik bulanan dengan query', async () => {
      api.getMonthlyStats.mockResolvedValue(ok(periodStats))
      const store = useCashFlowsStore()
      const query = { total_data: 12 }

      await store.fetchMonthlyStats(query)

      expect(api.getMonthlyStats).toHaveBeenCalledWith(query)
      expect(store.monthlyStats).toEqual(periodStats)
    })

    it('fetchMonthlyStats berjalan tanpa query', async () => {
      api.getMonthlyStats.mockResolvedValue(ok(periodStats))
      const store = useCashFlowsStore()

      await store.fetchMonthlyStats()

      expect(api.getMonthlyStats).toHaveBeenCalledWith(undefined)
    })
  })

  describe('createCashFlow', () => {
    it('mengembalikan id transaksi baru', async () => {
      api.create.mockResolvedValue(ok<CashFlowCreatedData>({ cash_flow_id: 9 }))
      const store = useCashFlowsStore()

      await expect(store.createCashFlow(payload)).resolves.toBe(9)

      expect(api.create).toHaveBeenCalledWith(payload)
      expect(store.saving).toBe(false)
    })

    it('saving bernilai true selama request berjalan', async () => {
      let resolve!: (value: ApiResponse<CashFlowCreatedData>) => void
      api.create.mockReturnValue(new Promise((r) => { resolve = r }))
      const store = useCashFlowsStore()

      const pending = store.createCashFlow(payload)
      expect(store.saving).toBe(true)

      resolve(ok<CashFlowCreatedData>({ cash_flow_id: 1 }))
      await pending
      expect(store.saving).toBe(false)
    })

    it('melempar ulang error dan mengembalikan saving ke false', async () => {
      api.create.mockRejectedValue(new Error('Data tidak valid'))
      const store = useCashFlowsStore()

      await expect(store.createCashFlow(payload)).rejects.toThrow('Data tidak valid')
      expect(store.saving).toBe(false)
    })
  })

  describe('updateCashFlow', () => {
    it('memanggil API dan mengembalikan saving ke false', async () => {
      api.update.mockResolvedValue(ok(undefined))
      const store = useCashFlowsStore()

      await store.updateCashFlow(4, payload)

      expect(api.update).toHaveBeenCalledWith(4, payload)
      expect(store.saving).toBe(false)
    })

    it('melempar ulang error dan mengembalikan saving ke false', async () => {
      api.update.mockRejectedValue(new Error('Data tidak valid'))
      const store = useCashFlowsStore()

      await expect(store.updateCashFlow(4, payload)).rejects.toThrow('Data tidak valid')
      expect(store.saving).toBe(false)
    })
  })

  describe('deleteCashFlow', () => {
    it('memanggil API dan mengembalikan saving ke false', async () => {
      api.remove.mockResolvedValue(ok(undefined))
      const store = useCashFlowsStore()

      await store.deleteCashFlow(4)

      expect(api.remove).toHaveBeenCalledWith(4)
      expect(store.saving).toBe(false)
    })

    it('melempar ulang error dan mengembalikan saving ke false', async () => {
      api.remove.mockRejectedValue(new Error('Data tidak ditemukan'))
      const store = useCashFlowsStore()

      await expect(store.deleteCashFlow(4)).rejects.toThrow('Data tidak ditemukan')
      expect(store.saving).toBe(false)
    })
  })

  describe('deleteAllCashFlows', () => {
    it('memanggil API dan mengembalikan saving ke false', async () => {
      api.removeAll.mockResolvedValue(ok(undefined))
      const store = useCashFlowsStore()

      await store.deleteAllCashFlows()

      expect(api.removeAll).toHaveBeenCalledOnce()
      expect(store.saving).toBe(false)
    })

    it('melempar ulang error dan mengembalikan saving ke false', async () => {
      api.removeAll.mockRejectedValue(new Error('Unauthenticated.'))
      const store = useCashFlowsStore()

      await expect(store.deleteAllCashFlows()).rejects.toThrow('Unauthenticated.')
      expect(store.saving).toBe(false)
    })
  })
})
