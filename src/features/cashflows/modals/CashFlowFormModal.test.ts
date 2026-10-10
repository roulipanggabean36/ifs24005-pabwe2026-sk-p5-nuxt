import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CashFlowFormModal from '~/features/cashflows/modals/CashFlowFormModal.vue'
import type { CashFlow } from '~/features/cashflows/types'

const labels = ['gaji', 'alat-mandi']

const keyboard: CashFlow = {
  id: 4,
  user_id: 1,
  type: 'inflow',
  source: 'savings',
  label: 'alat-elektronik',
  description: 'Membeli keyboard dan mouse',
  nominal: 400000,
  created_at: '2026-10-05T12:09:16.000000Z',
  updated_at: '2026-10-05T12:09:16.000000Z',
}

type ModalProps = Partial<{ open: boolean; cashFlow: CashFlow | null; saving: boolean }>

const mountModal = (props: ModalProps = {}) =>
  mount(CashFlowFormModal, { props: { open: true, labels, saving: false, ...props } })

type Modal = ReturnType<typeof mountModal>

const valueOf = (wrapper: Modal, selector: string): string =>
  wrapper.get<HTMLInputElement>(selector).element.value

const checkedType = (wrapper: Modal): string | undefined =>
  wrapper
    .findAll<HTMLInputElement>('input[name="cashflow-type"]')
    .find((radio) => radio.element.checked)?.element.value

const fill = async (wrapper: Modal, label: string, description: string, nominal: string) => {
  await wrapper.get('#cashflow-label').setValue(label)
  await wrapper.get('#cashflow-description').setValue(description)
  await wrapper.get('#cashflow-nominal').setValue(nominal)
}

const submit = (wrapper: Modal) => wrapper.get('form').trigger('submit')

const NOMINAL_ERROR = 'Nominal harus berupa bilangan bulat lebih dari 0.'

describe('CashFlowFormModal', () => {
  describe('mode tambah', () => {
    it('menampilkan judul, tombol, dan nilai awal', () => {
      const wrapper = mountModal()

      expect(wrapper.get('h2').text()).toBe('Tambah transaksi')
      expect(wrapper.get('button[type="submit"]').text()).toBe('Simpan transaksi')
      expect(checkedType(wrapper)).toBe('outflow')
      expect(valueOf(wrapper, '#cashflow-source')).toBe('cash')
      expect(valueOf(wrapper, '#cashflow-label')).toBe('')
      expect(valueOf(wrapper, '#cashflow-nominal')).toBe('')
      expect(valueOf(wrapper, '#cashflow-description')).toBe('')
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })

    it('menampilkan label yang sudah pernah dipakai sebagai saran', () => {
      const wrapper = mountModal()

      const suggestions = wrapper
        .findAll('#cashflow-label-options option')
        .map((option) => option.attributes('value'))
      expect(suggestions).toEqual(labels)
    })

    it('mengirim data yang sudah di-trim saat form valid', async () => {
      const wrapper = mountModal()
      await wrapper.get('input[value="inflow"]').setValue(true)
      await wrapper.get('#cashflow-source').setValue('loans')
      await fill(wrapper, '  gaji ', ' Gaji bulanan ', '2500000')

      await submit(wrapper)

      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(wrapper.emitted('submit')).toEqual([
        [
          {
            type: 'inflow',
            source: 'loans',
            label: 'gaji',
            description: 'Gaji bulanan',
            nominal: 2500000,
          },
        ],
      ])
    })
  })

  describe('validasi', () => {
    it.each([
      ['label kosong', '', 'Gaji bulanan', '1000', 'Label wajib diisi.'],
      ['label hanya spasi', '   ', 'Gaji bulanan', '1000', 'Label wajib diisi.'],
      ['deskripsi kosong', 'gaji', '', '1000', 'Deskripsi wajib diisi.'],
      ['nominal kosong', 'gaji', 'Gaji bulanan', '', NOMINAL_ERROR],
      ['nominal nol', 'gaji', 'Gaji bulanan', '0', NOMINAL_ERROR],
      ['nominal negatif', 'gaji', 'Gaji bulanan', '-5', NOMINAL_ERROR],
      ['nominal desimal', 'gaji', 'Gaji bulanan', '1.5', NOMINAL_ERROR],
    ])('menolak saat %s', async (_name, label, description, nominal, message) => {
      const wrapper = mountModal()
      await fill(wrapper, label, description, nominal)

      await submit(wrapper)

      expect(wrapper.get('[role="alert"]').text()).toBe(message)
      expect(wrapper.emitted('submit')).toBeUndefined()
    })

    it('menghapus pesan error saat isian diperbaiki lalu dikirim ulang', async () => {
      const wrapper = mountModal()
      await fill(wrapper, '', 'Gaji bulanan', '1000')
      await submit(wrapper)
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)

      await wrapper.get('#cashflow-label').setValue('gaji')
      await submit(wrapper)

      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(wrapper.emitted('submit')).toHaveLength(1)
    })
  })

  describe('mode ubah', () => {
    it('mengisi form dari transaksi yang dipilih', () => {
      const wrapper = mountModal({ cashFlow: keyboard })

      expect(wrapper.get('h2').text()).toBe('Ubah transaksi')
      expect(wrapper.get('button[type="submit"]').text()).toBe('Simpan perubahan')
      expect(checkedType(wrapper)).toBe('inflow')
      expect(valueOf(wrapper, '#cashflow-source')).toBe('savings')
      expect(valueOf(wrapper, '#cashflow-label')).toBe('alat-elektronik')
      expect(valueOf(wrapper, '#cashflow-nominal')).toBe('400000')
      expect(valueOf(wrapper, '#cashflow-description')).toBe('Membeli keyboard dan mouse')
    })

    it('mengirim data transaksi apa adanya saat tidak ada perubahan', async () => {
      const wrapper = mountModal({ cashFlow: keyboard })

      await submit(wrapper)

      expect(wrapper.emitted('submit')).toEqual([
        [
          {
            type: 'inflow',
            source: 'savings',
            label: 'alat-elektronik',
            description: 'Membeli keyboard dan mouse',
            nominal: 400000,
          },
        ],
      ])
    })
  })

  describe('membuka ulang modal', () => {
    it('mengisi form saat modal dibuka setelah sebelumnya tertutup', async () => {
      const wrapper = mountModal({ open: false, cashFlow: keyboard })
      expect(wrapper.find('form').exists()).toBe(false)

      await wrapper.setProps({ open: true })

      expect(valueOf(wrapper, '#cashflow-label')).toBe('alat-elektronik')
    })

    it('mengosongkan form dan pesan error saat dibuka untuk transaksi baru', async () => {
      const wrapper = mountModal({ cashFlow: keyboard })
      await wrapper.get('#cashflow-label').setValue('')
      await submit(wrapper)
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)

      await wrapper.setProps({ open: false })
      await wrapper.setProps({ open: true, cashFlow: null })

      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(checkedType(wrapper)).toBe('outflow')
      expect(valueOf(wrapper, '#cashflow-source')).toBe('cash')
      expect(valueOf(wrapper, '#cashflow-label')).toBe('')
      expect(valueOf(wrapper, '#cashflow-nominal')).toBe('')
      expect(valueOf(wrapper, '#cashflow-description')).toBe('')
    })
  })

  describe('tombol', () => {
    it('menonaktifkan tombol simpan saat sedang menyimpan', () => {
      const wrapper = mountModal({ saving: true })

      expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    })

    it('mengaktifkan tombol simpan saat tidak sedang menyimpan', () => {
      const wrapper = mountModal({ saving: false })

      expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
    })

    it('mengirim close saat tombol Batal diklik', async () => {
      const wrapper = mountModal()

      const cancel = wrapper.findAll('button').find((button) => button.text() === 'Batal')
      await cancel?.trigger('click')

      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('mengirim close saat tombol tutup di header diklik', async () => {
      const wrapper = mountModal()

      await wrapper.get('button[aria-label="Tutup"]').trigger('click')

      expect(wrapper.emitted('close')).toHaveLength(1)
    })
  })
})
