import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cashflowsApi } from '~/features/cashflows/cashflowsApi'
import HomePage from '~/features/cashflows/pages/HomePage.vue'
import type {
  CashFlow,
  CashFlowCreatedData,
  CashFlowsData,
  LabelsData,
  PeriodStats,
} from '~/features/cashflows/types'
import type { ApiResponse } from '~/helpers/apiHelper'
import { formatCurrency, showConfirm, showError, showSuccess } from '~/helpers/toolsHelper'
import { flushPromises, renderWithProviders } from '~/test-utils'

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

const listData: CashFlowsData = {
  cash_flows: [keyboard, gaji],
  stats: { total_inflow: 2500000, total_outflow: 400000 },
}

const periodStats: PeriodStats = {
  stats_inflow: { '05-10-2026': 2500000 },
  stats_outflow: { '05-10-2026': 400000 },
  stats_cashflow: { '05-10-2026': 2100000 },
}

const EMPTY_QUERY = { type: '', source: '', label: '', start_date: '', end_date: '' }

const ok = <T>(data: T): ApiResponse<T> => ({ status: 'success', message: 'OK', data })

const mountPage = async () => {
  const { wrapper } = renderWithProviders(HomePage, { stubActions: false })
  await flushPromises()
  return wrapper
}

type Page = Awaited<ReturnType<typeof mountPage>>

const clickButton = async (wrapper: Page, text: string) => {
  const target = wrapper.findAll('button').find((button) => button.text() === text)
  expect(target, `Tombol "${text}" tidak ditemukan`).toBeDefined()
  await target?.trigger('click')
  await flushPromises()
}

const dialog = (wrapper: Page) => wrapper.find('[role="dialog"]')

const fillForm = async (wrapper: Page, label: string, description: string, nominal: string) => {
  await wrapper.get('#cashflow-label').setValue(label)
  await wrapper.get('#cashflow-description').setValue(description)
  await wrapper.get('#cashflow-nominal').setValue(nominal)
}

const submitForm = async (wrapper: Page) => {
  await wrapper.get('[role="dialog"] form').trigger('submit')
  await flushPromises()
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    api.getAll.mockResolvedValue(ok(listData))
    api.getLabels.mockResolvedValue(ok<LabelsData>({ labels: ['gaji', 'alat-elektronik'] }))
    api.getDailyStats.mockResolvedValue(ok(periodStats))
    api.getMonthlyStats.mockResolvedValue(ok(periodStats))
  })

  describe('memuat data', () => {
    it('memuat daftar, label, dan statistik saat dibuka', async () => {
      const wrapper = await mountPage()

      expect(api.getAll).toHaveBeenCalledWith(EMPTY_QUERY)
      expect(api.getLabels).toHaveBeenCalledOnce()
      expect(api.getDailyStats).toHaveBeenCalledWith({ total_data: 7 })
      expect(api.getMonthlyStats).toHaveBeenCalledWith({ total_data: 6 })

      expect(wrapper.get('[data-testid="balance"]').text()).toBe(formatCurrency(2100000))
      expect(wrapper.get('[data-testid="inflow"]').text()).toBe(formatCurrency(2500000))
      expect(wrapper.get('[data-testid="outflow"]').text()).toBe(formatCurrency(400000))
      expect(wrapper.findAll('[data-testid="nominal"]')).toHaveLength(2)
      expect(wrapper.text()).toContain('alat-elektronik')
      expect(wrapper.text()).toContain('Arus kas harian')
      expect(wrapper.text()).toContain('Arus kas bulanan')
    })

    it('menampilkan status memuat selama daftar belum tiba', async () => {
      let resolve!: (value: ApiResponse<CashFlowsData>) => void
      api.getAll.mockReturnValue(new Promise((r) => { resolve = r }))

      const wrapper = await mountPage()
      expect(wrapper.get('[role="status"]').text()).toBe('Memuat transaksi...')
      expect(wrapper.find('[data-testid="nominal"]').exists()).toBe(false)

      resolve(ok(listData))
      await flushPromises()
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
      expect(wrapper.findAll('[data-testid="nominal"]')).toHaveLength(2)
    })

    it('menampilkan pesan error saat daftar gagal dimuat', async () => {
      api.getAll.mockRejectedValue(new Error('Tidak dapat terhubung ke server.'))

      await mountPage()

      expect(showError).toHaveBeenCalledWith('Tidak dapat terhubung ke server.')
    })

    it('menyembunyikan grafik yang datanya gagal dimuat', async () => {
      api.getDailyStats.mockRejectedValue(new Error('Gagal memuat statistik harian'))

      const wrapper = await mountPage()

      expect(showError).toHaveBeenCalledWith('Gagal memuat statistik harian')
      expect(wrapper.text()).not.toContain('Arus kas harian')
      expect(wrapper.text()).toContain('Arus kas bulanan')
    })

    it('menyembunyikan grafik bulanan saat statistik bulanan gagal dimuat', async () => {
      api.getMonthlyStats.mockRejectedValue(new Error('Gagal memuat statistik bulanan'))

      const wrapper = await mountPage()

      expect(wrapper.text()).toContain('Arus kas harian')
      expect(wrapper.text()).not.toContain('Arus kas bulanan')
    })
  })

  describe('filter', () => {
    it('memuat ulang daftar dengan filter yang dipilih', async () => {
      const wrapper = await mountPage()

      await wrapper.get('#filter-type').setValue('inflow')
      await flushPromises()

      expect(api.getAll).toHaveBeenCalledTimes(2)
      expect(api.getAll).toHaveBeenLastCalledWith({ ...EMPTY_QUERY, type: 'inflow' })
    })

    it('menghapus filter lalu memuat ulang daftar', async () => {
      const wrapper = await mountPage()
      await wrapper.get('#filter-source').setValue('cash')
      await flushPromises()

      await clickButton(wrapper, 'Hapus filter')

      expect(api.getAll).toHaveBeenCalledTimes(3)
      expect(api.getAll).toHaveBeenLastCalledWith(EMPTY_QUERY)
      expect(wrapper.find('#filter-source').exists()).toBe(true)
      expect(wrapper.get<HTMLSelectElement>('#filter-source').element.value).toBe('')
    })

    it('menampilkan pesan error saat memuat ulang daftar gagal', async () => {
      const wrapper = await mountPage()
      api.getAll.mockRejectedValue(new Error('Gagal memuat transaksi'))

      await wrapper.get('#filter-type').setValue('outflow')
      await flushPromises()

      expect(showError).toHaveBeenCalledWith('Gagal memuat transaksi')
    })
  })

  describe('tambah transaksi', () => {
    it('membuka form kosong, menyimpan, lalu memuat ulang data', async () => {
      api.create.mockResolvedValue(ok<CashFlowCreatedData>({ cash_flow_id: 9 }))
      const wrapper = await mountPage()
      expect(dialog(wrapper).exists()).toBe(false)

      await clickButton(wrapper, 'Tambah transaksi')
      expect(wrapper.get('[role="dialog"] h2').text()).toBe('Tambah transaksi')

      await fillForm(wrapper, 'makan', 'Makan siang', '25000')
      await submitForm(wrapper)

      expect(api.create).toHaveBeenCalledWith({
        type: 'outflow',
        source: 'cash',
        label: 'makan',
        description: 'Makan siang',
        nominal: 25000,
      })
      expect(showSuccess).toHaveBeenCalledWith('Transaksi berhasil ditambahkan.')
      expect(dialog(wrapper).exists()).toBe(false)
      expect(api.getAll).toHaveBeenCalledTimes(2)
      expect(api.getLabels).toHaveBeenCalledTimes(2)
    })

    it('tetap membuka form dan menampilkan error saat gagal menyimpan', async () => {
      api.create.mockRejectedValue(new Error('Data tidak valid'))
      const wrapper = await mountPage()
      await clickButton(wrapper, 'Tambah transaksi')
      await fillForm(wrapper, 'makan', 'Makan siang', '25000')

      await submitForm(wrapper)

      expect(showError).toHaveBeenCalledWith('Data tidak valid')
      expect(showSuccess).not.toHaveBeenCalled()
      expect(dialog(wrapper).exists()).toBe(true)
      expect(api.getAll).toHaveBeenCalledTimes(1)
    })

    it('menutup form saat Batal diklik', async () => {
      const wrapper = await mountPage()
      await clickButton(wrapper, 'Tambah transaksi')

      await clickButton(wrapper, 'Batal')

      expect(dialog(wrapper).exists()).toBe(false)
      expect(api.create).not.toHaveBeenCalled()
    })
  })

  describe('ubah transaksi', () => {
    it('membuka form terisi, menyimpan perubahan, lalu memuat ulang data', async () => {
      api.update.mockResolvedValue(ok(undefined))
      const wrapper = await mountPage()

      await wrapper.get('button[aria-label="Ubah transaksi gaji"]').trigger('click')
      await flushPromises()
      expect(wrapper.get('[role="dialog"] h2').text()).toBe('Ubah transaksi')
      expect(wrapper.get<HTMLInputElement>('#cashflow-label').element.value).toBe('gaji')

      await wrapper.get('#cashflow-nominal').setValue('3000000')
      await submitForm(wrapper)

      expect(api.update).toHaveBeenCalledWith(2, {
        type: 'inflow',
        source: 'cash',
        label: 'gaji',
        description: 'Gaji bulanan',
        nominal: 3000000,
      })
      expect(showSuccess).toHaveBeenCalledWith('Transaksi berhasil diperbarui.')
      expect(dialog(wrapper).exists()).toBe(false)
      expect(api.getAll).toHaveBeenCalledTimes(2)
    })

    it('membuka form kosong untuk transaksi baru setelah sebelumnya mengubah', async () => {
      const wrapper = await mountPage()
      await wrapper.get('button[aria-label="Ubah transaksi gaji"]').trigger('click')
      await flushPromises()
      await clickButton(wrapper, 'Batal')

      await clickButton(wrapper, 'Tambah transaksi')

      expect(wrapper.get('[role="dialog"] h2').text()).toBe('Tambah transaksi')
      expect(wrapper.get<HTMLInputElement>('#cashflow-label').element.value).toBe('')
    })
  })

  describe('hapus transaksi', () => {
    const clickDelete = async (wrapper: Page) => {
      await wrapper.get('button[aria-label="Hapus transaksi alat-elektronik"]').trigger('click')
      await flushPromises()
    }

    it('menghapus setelah dikonfirmasi lalu memuat ulang data', async () => {
      vi.mocked(showConfirm).mockResolvedValue(true)
      api.remove.mockResolvedValue(ok(undefined))
      const wrapper = await mountPage()

      await clickDelete(wrapper)

      expect(showConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Hapus transaksi?', confirmText: 'Hapus' }),
      )
      expect(api.remove).toHaveBeenCalledWith(4)
      expect(showSuccess).toHaveBeenCalledWith('Transaksi berhasil dihapus.')
      expect(api.getAll).toHaveBeenCalledTimes(2)
    })

    it('tidak menghapus saat konfirmasi dibatalkan', async () => {
      vi.mocked(showConfirm).mockResolvedValue(false)
      const wrapper = await mountPage()

      await clickDelete(wrapper)

      expect(api.remove).not.toHaveBeenCalled()
      expect(api.getAll).toHaveBeenCalledTimes(1)
    })

    it('menampilkan pesan error saat gagal menghapus', async () => {
      vi.mocked(showConfirm).mockResolvedValue(true)
      api.remove.mockRejectedValue(new Error('Data tidak ditemukan'))
      const wrapper = await mountPage()

      await clickDelete(wrapper)

      expect(showError).toHaveBeenCalledWith('Data tidak ditemukan')
      expect(showSuccess).not.toHaveBeenCalled()
    })
  })

  describe('hapus semua transaksi', () => {
    it('menghapus semua setelah dikonfirmasi lalu memuat ulang data', async () => {
      vi.mocked(showConfirm).mockResolvedValue(true)
      api.removeAll.mockResolvedValue(ok(undefined))
      const wrapper = await mountPage()

      await clickButton(wrapper, 'Hapus semua')

      expect(showConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Hapus semua transaksi?', confirmText: 'Hapus semua' }),
      )
      expect(api.removeAll).toHaveBeenCalledOnce()
      expect(showSuccess).toHaveBeenCalledWith('Semua transaksi berhasil dihapus.')
      expect(api.getAll).toHaveBeenCalledTimes(2)
    })

    it('tidak menghapus saat konfirmasi dibatalkan', async () => {
      vi.mocked(showConfirm).mockResolvedValue(false)
      const wrapper = await mountPage()

      await clickButton(wrapper, 'Hapus semua')

      expect(api.removeAll).not.toHaveBeenCalled()
    })

    it('menampilkan pesan error saat gagal menghapus', async () => {
      vi.mocked(showConfirm).mockResolvedValue(true)
      api.removeAll.mockRejectedValue(new Error('Unauthenticated.'))
      const wrapper = await mountPage()

      await clickButton(wrapper, 'Hapus semua')

      expect(showError).toHaveBeenCalledWith('Unauthenticated.')
      expect(showSuccess).not.toHaveBeenCalled()
    })
  })
})
