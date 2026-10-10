import { RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CashFlowList from '~/features/cashflows/components/CashFlowList.vue'
import type { CashFlow } from '~/features/cashflows/types'
import { formatCurrency, formatDate } from '~/helpers/toolsHelper'
import { renderWithProviders } from '~/test-utils'

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
  description: 'Membeli keyboard dan mouse',
  nominal: 400000,
}

const mountList = (cashFlows: CashFlow[]) =>
  renderWithProviders(CashFlowList, { props: { cashFlows } }).wrapper

describe('CashFlowList', () => {
  it('menampilkan pesan kosong saat belum ada transaksi', () => {
    const wrapper = mountList([])

    expect(wrapper.text()).toContain('Belum ada transaksi.')
    expect(wrapper.find('li').exists()).toBe(false)
  })

  it('menampilkan satu baris per transaksi lengkap dengan detailnya', () => {
    const wrapper = mountList([keyboard, gaji])

    const rows = wrapper.findAll('li')
    expect(rows).toHaveLength(2)
    expect(rows[0]?.text()).toContain('alat-elektronik')
    expect(rows[0]?.text()).toContain('Membeli keyboard dan mouse')
    expect(rows[0]?.text()).toContain('Tabungan')
    expect(rows[0]?.text()).toContain(formatDate(keyboard.created_at))
    expect(rows[1]?.text()).toContain('Tunai')
  })

  it('menautkan label ke halaman detail transaksi', () => {
    const wrapper = mountList([keyboard, gaji])

    const links = wrapper.findAllComponents(RouterLinkStub)
    expect(links.map((link) => link.props('to'))).toEqual(['/cash-flows/4', '/cash-flows/2'])
  })

  it('memberi tanda dan warna berbeda untuk pemasukan dan pengeluaran', () => {
    const wrapper = mountList([keyboard, gaji])

    const [outflow, inflow] = wrapper.findAll('[data-testid="nominal"]')
    expect(outflow?.text()).toBe(`-${formatCurrency(400000)}`)
    expect(outflow?.classes()).toContain('text-expense')
    expect(inflow?.text()).toBe(`+${formatCurrency(2500000)}`)
    expect(inflow?.classes()).toContain('text-income')
  })

  it('mengirim event edit dengan transaksi yang dipilih', async () => {
    const wrapper = mountList([keyboard, gaji])

    await wrapper.get('button[aria-label="Ubah transaksi gaji"]').trigger('click')

    expect(wrapper.emitted('edit')).toEqual([[gaji]])
  })

  it('mengirim event delete dengan transaksi yang dipilih', async () => {
    const wrapper = mountList([keyboard, gaji])

    await wrapper.get('button[aria-label="Hapus transaksi alat-elektronik"]').trigger('click')

    expect(wrapper.emitted('delete')).toEqual([[keyboard]])
  })
})
