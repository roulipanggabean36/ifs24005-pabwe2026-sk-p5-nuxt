import { mount } from '@vue/test-utils'
import type { DOMWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PeriodChart from '~/features/cashflows/components/PeriodChart.vue'
import { formatCurrency } from '~/helpers/toolsHelper'

const heights = (bars: DOMWrapper<Element>[]): string[] =>
  bars.map((bar) => (bar.element as HTMLElement).style.height)

describe('PeriodChart', () => {
  it('menampilkan judul dan legenda', () => {
    const wrapper = mount(PeriodChart, {
      props: { title: 'Statistik harian', inflow: {}, outflow: {} },
    })

    expect(wrapper.get('h3').text()).toBe('Statistik harian')
    expect(wrapper.text()).toContain('Pemasukan')
    expect(wrapper.text()).toContain('Pengeluaran')
  })

  it('menampilkan pesan kosong saat belum ada data', () => {
    const wrapper = mount(PeriodChart, {
      props: { title: 'Statistik harian', inflow: {}, outflow: {} },
    })

    expect(wrapper.text()).toContain('Belum ada data statistik')
    expect(wrapper.find('li').exists()).toBe(false)
  })

  it('menghitung tinggi batang relatif terhadap nilai terbesar', () => {
    const wrapper = mount(PeriodChart, {
      props: {
        title: 'Statistik harian',
        inflow: { '05-10-2026': 200, '06-10-2026': 100 },
        outflow: { '05-10-2026': 50 },
      },
    })

    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(heights(wrapper.findAll('[data-testid="bar-inflow"]'))).toEqual(['100%', '50%'])
    // periode yang tidak ada di outflow dianggap 0
    expect(heights(wrapper.findAll('[data-testid="bar-outflow"]'))).toEqual(['25%', '0%'])
  })

  it('tinggi batang 0 saat semua nilai 0', () => {
    const wrapper = mount(PeriodChart, {
      props: { title: 'Statistik bulanan', inflow: { '10-2026': 0 }, outflow: { '10-2026': 0 } },
    })

    expect(heights(wrapper.findAll('[data-testid="bar-inflow"]'))).toEqual(['0%'])
    expect(heights(wrapper.findAll('[data-testid="bar-outflow"]'))).toEqual(['0%'])
  })

  it('menyediakan teks ringkasan untuk pembaca layar dan tooltip', () => {
    const wrapper = mount(PeriodChart, {
      props: { title: 'Statistik bulanan', inflow: { '10-2026': 2500000 }, outflow: { '10-2026': 400000 } },
    })

    const expected = `Pemasukan ${formatCurrency(2500000)}, pengeluaran ${formatCurrency(400000)}`
    const item = wrapper.get('li')
    expect(item.get('.sr-only').text()).toBe(expected)
    expect(item.attributes('title')).toBe(expected)
    expect(item.text()).toContain('10-2026')
  })
})
