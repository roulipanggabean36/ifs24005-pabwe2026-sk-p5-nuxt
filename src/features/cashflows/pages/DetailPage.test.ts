import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { cashflowsApi } from '~/features/cashflows/cashflowsApi'
import DetailPage from '~/features/cashflows/pages/DetailPage.vue'
import type { CashFlow, CashFlowData, LabelsData } from '~/features/cashflows/types'
import type { ApiResponse } from '~/helpers/apiHelper'
import { formatCurrency, formatDate, showConfirm, showError, showSuccess } from '~/helpers/toolsHelper'
import { createMockRouter, flushPromises, renderWithProviders } from '~/test-utils'

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

vi.mock('~/helpers/toolsHelper', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/helpers/toolsHelper')>()),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  showConfirm: vi.fn(),
}))

const api = vi.mocked(cashflowsApi)

const keyboard: CashFlow = {
  id: 4,
  user_id: 1,
  type: 'outflow',
  source: 'savings',
  label: 'alat-elektronik',
  description: 'Membeli keyboard dan mouse',
  nominal: 400000,
  created_at: '2026-10-05T12:09:16.000000Z',
  updated_at: '2026-10-06T08:00:00.000000Z',
}

const gaji: CashFlow = {
  ...keyboard,
  type: 'inflow',
  source: 'cash',
  label: 'gaji',
  description: 'Gaji bulanan',
  nominal: 2500000,
}

const Blank = defineComponent({ render: () => h('div') })

const ok = <T>(data: T): ApiResponse<T> => ({ status: 'success', message: 'OK', data })

const mountPage = async () => {
  const router = createMockRouter([
    { path: '/', component: Blank },
    { path: '/cash-flows/:id', component: DetailPage },
  ])
  await router.push('/cash-flows/4')
  await router.isReady()

  const { wrapper } = renderWithProviders(DetailPage, { stubActions: false, router })
  await flushPromises()
  return { wrapper, router }
}

type Page = Awaited<ReturnType<typeof mountPage>>['wrapper']

const clickButton = async (wrapper: Page, text: string) => {
  const target = wrapper.findAll('button').find((button) => button.text() === text)
  expect(target, `Tombol "${text}" tidak ditemukan`).toBeDefined()
  await target?.trigger('click')
  await flushPromises()
}

const dialog = (wrapper: Page) => wrapper.find('[role="dialog"]')

describe('DetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    api.getById.mockResolvedValue(ok<CashFlowData>({ cash_flow: keyboard }))
    api.getLabels.mockResolvedValue(ok<LabelsData>({ labels: ['gaji', 'alat-elektronik'] }))
  })

  describe('memuat data', () => {
    it('memuat transaksi dan label berdasarkan id di URL', async () => {
      await mountPage()

      expect(api.getById).toHaveBeenCalledWith(4)
      expect(api.getLabels).toHaveBeenCalledOnce()
    })

    it('menampilkan seluruh detail transaksi pengeluaran', async () => {
      const { wrapper } = await mountPage()

      expect(wrapper.get('h1').text()).toBe('alat-elektronik')
      expect(wrapper.text()).toContain('Pengeluaran')
      expect(wrapper.text()).toContain('Tabungan')
      expect(wrapper.text()).toContain('Membeli keyboard dan mouse')
      expect(wrapper.text()).toContain(formatDate(keyboard.created_at))
      expect(wrapper.text()).toContain(formatDate(keyboard.updated_at))

      const nominal = wrapper.get('[data-testid="nominal"]')
      expect(nominal.text()).toBe(`-${formatCurrency(400000)}`)
      expect(nominal.classes()).toContain('text-expense')
    })

    it('menampilkan transaksi pemasukan dengan tanda dan warna pemasukan', async () => {
      api.getById.mockResolvedValue(ok<CashFlowData>({ cash_flow: gaji }))

      const { wrapper } = await mountPage()

      expect(wrapper.text()).toContain('Pemasukan')
      expect(wrapper.text()).toContain('Tunai')
      const nominal = wrapper.get('[data-testid="nominal"]')
      expect(nominal.text()).toBe(`+${formatCurrency(2500000)}`)
      expect(nominal.classes()).toContain('text-income')
    })

    it('menyediakan tautan kembali ke beranda', async () => {
      const { wrapper } = await mountPage()

      const back = wrapper.get('a[href="/"]')
      expect(back.text()).toBe('Kembali ke beranda')
    })

    it('menampilkan status memuat selama data belum tiba', async () => {
      let resolve!: (value: ApiResponse<CashFlowData>) => void
      api.getById.mockReturnValue(new Promise((r) => { resolve = r }))

      const { wrapper } = await mountPage()
      expect(wrapper.get('[role="status"]').text()).toBe('Memuat transaksi...')
      expect(wrapper.find('article').exists()).toBe(false)

      resolve(ok<CashFlowData>({ cash_flow: keyboard }))
      await flushPromises()
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
      expect(wrapper.find('article').exists()).toBe(true)
    })

    it('menampilkan pesan error saat transaksi tidak dapat dimuat', async () => {
      api.getById.mockRejectedValue(new Error('Data tidak ditemukan'))

      const { wrapper } = await mountPage()

      const alert = wrapper.get('[role="alert"]')
      expect(alert.text()).toContain('Transaksi tidak dapat dimuat')
      expect(alert.text()).toContain('Data tidak ditemukan')
      expect(wrapper.find('article').exists()).toBe(false)
    })
  })

  describe('ubah transaksi', () => {
    it('membuka form terisi data transaksi', async () => {
      const { wrapper } = await mountPage()
      expect(dialog(wrapper).exists()).toBe(false)

      await clickButton(wrapper, 'Ubah')

      expect(wrapper.get('[role="dialog"] h2').text()).toBe('Ubah transaksi')
      expect(wrapper.get<HTMLInputElement>('#cashflow-label').element.value).toBe('alat-elektronik')
    })

    it('menyimpan perubahan, menutup form, dan memuat ulang transaksi', async () => {
      api.update.mockResolvedValue(ok(undefined))
      const { wrapper } = await mountPage()
      await clickButton(wrapper, 'Ubah')

      await wrapper.get('#cashflow-nominal').setValue('450000')
      await wrapper.get('[role="dialog"] form').trigger('submit')
      await flushPromises()

      expect(api.update).toHaveBeenCalledWith(4, {
        type: 'outflow',
        source: 'savings',
        label: 'alat-elektronik',
        description: 'Membeli keyboard dan mouse',
        nominal: 450000,
      })
      expect(showSuccess).toHaveBeenCalledWith('Transaksi berhasil diperbarui.')
      expect(dialog(wrapper).exists()).toBe(false)
      expect(api.getById).toHaveBeenCalledTimes(2)
    })

    it('tetap membuka form dan menampilkan error saat gagal menyimpan', async () => {
      api.update.mockRejectedValue(new Error('Data tidak valid'))
      const { wrapper } = await mountPage()
      await clickButton(wrapper, 'Ubah')

      await wrapper.get('[role="dialog"] form').trigger('submit')
      await flushPromises()

      expect(showError).toHaveBeenCalledWith('Data tidak valid')
      expect(showSuccess).not.toHaveBeenCalled()
      expect(dialog(wrapper).exists()).toBe(true)
      expect(api.getById).toHaveBeenCalledTimes(1)
    })

    it('menutup form saat Batal diklik', async () => {
      const { wrapper } = await mountPage()
      await clickButton(wrapper, 'Ubah')

      await clickButton(wrapper, 'Batal')

      expect(dialog(wrapper).exists()).toBe(false)
      expect(api.update).not.toHaveBeenCalled()
    })
  })

  describe('hapus transaksi', () => {
    it('menghapus setelah dikonfirmasi lalu kembali ke beranda', async () => {
      vi.mocked(showConfirm).mockResolvedValue(true)
      api.remove.mockResolvedValue(ok(undefined))
      const { wrapper, router } = await mountPage()

      await clickButton(wrapper, 'Hapus')

      expect(showConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Hapus transaksi?', confirmText: 'Hapus' }),
      )
      expect(api.remove).toHaveBeenCalledWith(4)
      expect(showSuccess).toHaveBeenCalledWith('Transaksi berhasil dihapus.')
      expect(router.currentRoute.value.path).toBe('/')
    })

    it('tidak menghapus saat konfirmasi dibatalkan', async () => {
      vi.mocked(showConfirm).mockResolvedValue(false)
      const { wrapper, router } = await mountPage()

      await clickButton(wrapper, 'Hapus')

      expect(api.remove).not.toHaveBeenCalled()
      expect(router.currentRoute.value.path).toBe('/cash-flows/4')
    })

    it('menampilkan pesan error dan tetap di halaman saat gagal menghapus', async () => {
      vi.mocked(showConfirm).mockResolvedValue(true)
      api.remove.mockRejectedValue(new Error('Data tidak ditemukan'))
      const { wrapper, router } = await mountPage()

      await clickButton(wrapper, 'Hapus')

      expect(showError).toHaveBeenCalledWith('Data tidak ditemukan')
      expect(showSuccess).not.toHaveBeenCalled()
      expect(router.currentRoute.value.path).toBe('/cash-flows/4')
    })
  })
})
