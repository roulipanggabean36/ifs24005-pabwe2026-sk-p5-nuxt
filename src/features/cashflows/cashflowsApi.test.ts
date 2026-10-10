import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cashflowsApi } from '~/features/cashflows/cashflowsApi'
import type { CashFlowPayload } from '~/features/cashflows/types'
import { api } from '~/helpers/apiHelper'
import type { ApiResponse } from '~/helpers/apiHelper'

vi.mock('~/helpers/apiHelper', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const response: ApiResponse<undefined> = { status: 'success', message: 'OK', data: undefined }

const payload: CashFlowPayload = {
  type: 'inflow',
  source: 'cash',
  label: 'gaji',
  description: 'Gaji bulanan',
  nominal: 2500000,
}

describe('cashflowsApi', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(api.get).mockResolvedValue(response)
    vi.mocked(api.post).mockResolvedValue(response)
    vi.mocked(api.put).mockResolvedValue(response)
    vi.mocked(api.delete).mockResolvedValue(response)
  })

  it('getAll memanggil GET /cash-flows dengan query filter', async () => {
    const query = { type: 'inflow', label: 'gaji' }

    await expect(cashflowsApi.getAll(query)).resolves.toBe(response)
    expect(api.get).toHaveBeenCalledWith('/cash-flows', query)
  })

  it('getAll memanggil GET /cash-flows tanpa query', async () => {
    await cashflowsApi.getAll()
    expect(api.get).toHaveBeenCalledWith('/cash-flows', undefined)
  })

  it('getById memanggil GET /cash-flows/:id', async () => {
    await expect(cashflowsApi.getById(4)).resolves.toBe(response)
    expect(api.get).toHaveBeenCalledWith('/cash-flows/4')
  })

  it('create memanggil POST /cash-flows dengan payload', async () => {
    await expect(cashflowsApi.create(payload)).resolves.toBe(response)
    expect(api.post).toHaveBeenCalledWith('/cash-flows', payload)
  })

  it('update memanggil PUT /cash-flows/:id dengan payload', async () => {
    await expect(cashflowsApi.update(4, payload)).resolves.toBe(response)
    expect(api.put).toHaveBeenCalledWith('/cash-flows/4', payload)
  })

  it('remove memanggil DELETE /cash-flows/:id', async () => {
    await expect(cashflowsApi.remove(4)).resolves.toBe(response)
    expect(api.delete).toHaveBeenCalledWith('/cash-flows/4')
  })

  it('removeAll memanggil DELETE /cash-flows', async () => {
    await expect(cashflowsApi.removeAll()).resolves.toBe(response)
    expect(api.delete).toHaveBeenCalledWith('/cash-flows')
  })

  it('getLabels memanggil GET /cash-flows/labels', async () => {
    await expect(cashflowsApi.getLabels()).resolves.toBe(response)
    expect(api.get).toHaveBeenCalledWith('/cash-flows/labels')
  })

  it('getDailyStats memanggil GET /cash-flows/stats/daily dengan query', async () => {
    const query = { end_date: '2026-10-10 23:59:59', total_data: 7 }

    await expect(cashflowsApi.getDailyStats(query)).resolves.toBe(response)
    expect(api.get).toHaveBeenCalledWith('/cash-flows/stats/daily', query)
  })

  it('getDailyStats memanggil GET tanpa query', async () => {
    await cashflowsApi.getDailyStats()
    expect(api.get).toHaveBeenCalledWith('/cash-flows/stats/daily', undefined)
  })

  it('getMonthlyStats memanggil GET /cash-flows/stats/monthly dengan query', async () => {
    const query = { total_data: 12 }

    await expect(cashflowsApi.getMonthlyStats(query)).resolves.toBe(response)
    expect(api.get).toHaveBeenCalledWith('/cash-flows/stats/monthly', query)
  })

  it('getMonthlyStats memanggil GET tanpa query', async () => {
    await cashflowsApi.getMonthlyStats()
    expect(api.get).toHaveBeenCalledWith('/cash-flows/stats/monthly', undefined)
  })
})
