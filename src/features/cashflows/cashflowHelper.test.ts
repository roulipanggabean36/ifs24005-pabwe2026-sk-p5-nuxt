import { describe, expect, it } from 'vitest'
import { getStat, hasActiveFilters, toApiQuery } from '~/features/cashflows/cashflowHelper'
import { EMPTY_FILTERS } from '~/features/cashflows/constants'
import type { CashFlowFilters, CashFlowStats } from '~/features/cashflows/types'

describe('getStat', () => {
  it('mengembalikan nilai statistik yang ada', () => {
    expect(getStat({ total_inflow: 2500000 }, 'total_inflow')).toBe(2500000)
  })

  it('mengembalikan 0 saat kunci tidak ada', () => {
    expect(getStat({ total_inflow: 1 }, 'total_outflow')).toBe(0)
  })

  it('mengembalikan 0 saat stats kosong berupa array (respons API tanpa transaksi)', () => {
    expect(getStat([] as unknown as CashFlowStats, 'total_inflow')).toBe(0)
  })
})

describe('hasActiveFilters', () => {
  it('false saat semua filter kosong', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
  })

  it('false saat label hanya berisi spasi', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, label: '   ' })).toBe(false)
  })

  it.each<[string, Partial<CashFlowFilters>]>([
    ['jenis', { type: 'inflow' }],
    ['sumber', { source: 'cash' }],
    ['label', { label: 'gaji' }],
    ['tanggal mulai', { start_date: '2026-10-01' }],
    ['tanggal akhir', { end_date: '2026-10-31' }],
  ])('true saat filter %s terisi', (_name, partial) => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, ...partial })).toBe(true)
  })
})

describe('toApiQuery', () => {
  it('mengirim string kosong saat filter kosong', () => {
    expect(toApiQuery(EMPTY_FILTERS)).toEqual({
      type: '',
      source: '',
      label: '',
      start_date: '',
      end_date: '',
    })
  })

  it('menambahkan jam pada tanggal dan merapikan label', () => {
    expect(
      toApiQuery({
        type: 'outflow',
        source: 'savings',
        label: '  alat-elektronik ',
        start_date: '2026-10-01',
        end_date: '2026-10-31',
      }),
    ).toEqual({
      type: 'outflow',
      source: 'savings',
      label: 'alat-elektronik',
      start_date: '2026-10-01 00:00:00',
      end_date: '2026-10-31 23:59:59',
    })
  })
})
