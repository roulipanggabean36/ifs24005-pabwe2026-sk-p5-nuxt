import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SummaryCards from '~/features/cashflows/components/SummaryCards.vue'
import { formatCurrency } from '~/helpers/toolsHelper'

const mountCards = (balance: number) =>
  mount(SummaryCards, {
    props: { balance, totalInflow: 2500000, totalOutflow: 400000 },
  })

describe('SummaryCards', () => {
  it('menampilkan saldo, pemasukan, dan pengeluaran dalam format rupiah', () => {
    const wrapper = mountCards(2100000)

    expect(wrapper.get('[data-testid="balance"]').text()).toBe(formatCurrency(2100000))
    expect(wrapper.get('[data-testid="inflow"]').text()).toBe(formatCurrency(2500000))
    expect(wrapper.get('[data-testid="outflow"]').text()).toBe(formatCurrency(400000))
  })

  it('menampilkan judul tiap kartu', () => {
    const text = mountCards(0).text()

    expect(text).toContain('Saldo')
    expect(text).toContain('Pemasukan')
    expect(text).toContain('Pengeluaran')
  })

  it('saldo berwarna merah saat negatif', () => {
    const classes = mountCards(-500).get('[data-testid="balance"]').classes()

    expect(classes).toContain('text-expense')
    expect(classes).not.toContain('text-slate-900')
  })

  it.each([0, 1000])('saldo berwarna netral saat %i', (balance) => {
    const classes = mountCards(balance).get('[data-testid="balance"]').classes()

    expect(classes).toContain('text-slate-900')
    expect(classes).not.toContain('text-expense')
  })
})
