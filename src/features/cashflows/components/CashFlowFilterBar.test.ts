import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CashFlowFilterBar from '~/features/cashflows/components/CashFlowFilterBar.vue'
import { EMPTY_FILTERS } from '~/features/cashflows/constants'
import type { CashFlowFilters } from '~/features/cashflows/types'

const labels = ['gaji', 'alat-mandi']

const mountBar = (modelValue: CashFlowFilters = EMPTY_FILTERS) =>
  mount(CashFlowFilterBar, { props: { modelValue, labels } })

describe('CashFlowFilterBar', () => {
  it('menampilkan pilihan jenis, sumber, dan label', () => {
    const wrapper = mountBar()
    const optionsOf = (selector: string) =>
      wrapper.findAll(`${selector} option`).map((option) => option.text())

    expect(optionsOf('#filter-type')).toEqual(['Semua jenis', 'Pemasukan', 'Pengeluaran'])
    expect(optionsOf('#filter-source')).toEqual([
      'Semua sumber',
      'Tunai',
      'Tabungan',
      'Pinjaman',
    ])
    expect(optionsOf('#filter-label')).toEqual(['Semua label', 'gaji', 'alat-mandi'])
  })

  it('menampilkan nilai filter yang sedang aktif', () => {
    const wrapper = mountBar({
      type: 'inflow',
      source: 'savings',
      label: 'gaji',
      start_date: '2026-10-01',
      end_date: '2026-10-31',
    })
    const valueOf = (selector: string) =>
      wrapper.get<HTMLInputElement>(selector).element.value

    expect(valueOf('#filter-type')).toBe('inflow')
    expect(valueOf('#filter-source')).toBe('savings')
    expect(valueOf('#filter-label')).toBe('gaji')
    expect(valueOf('#filter-start')).toBe('2026-10-01')
    expect(valueOf('#filter-end')).toBe('2026-10-31')
  })

  it.each([
    ['#filter-type', 'inflow', 'type'],
    ['#filter-source', 'loans', 'source'],
    ['#filter-label', 'alat-mandi', 'label'],
    ['#filter-start', '2026-10-01', 'start_date'],
    ['#filter-end', '2026-10-31', 'end_date'],
  ])('mengirim filter baru saat %s diubah', async (selector, value, key) => {
    const wrapper = mountBar()

    await wrapper.get(selector).setValue(value)

    expect(wrapper.emitted('update:modelValue')).toEqual([[{ ...EMPTY_FILTERS, [key]: value }]])
  })

  it('mempertahankan filter lain saat satu filter berubah', async () => {
    const current: CashFlowFilters = { ...EMPTY_FILTERS, source: 'cash', label: 'gaji' }
    const wrapper = mountBar(current)

    await wrapper.get('#filter-type').setValue('outflow')

    expect(wrapper.emitted('update:modelValue')).toEqual([[{ ...current, type: 'outflow' }]])
  })

  it('menyembunyikan tombol hapus filter saat tidak ada filter aktif', () => {
    expect(mountBar().find('button').exists()).toBe(false)
  })

  it('menampilkan tombol hapus filter dan mengirim reset saat diklik', async () => {
    const wrapper = mountBar({ ...EMPTY_FILTERS, label: 'gaji' })

    const button = wrapper.get('button')
    expect(button.text()).toBe('Hapus filter')
    await button.trigger('click')

    expect(wrapper.emitted('reset')).toHaveLength(1)
  })

  it('tidak memuat ulang halaman saat form disubmit', async () => {
    const wrapper = mountBar()

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
