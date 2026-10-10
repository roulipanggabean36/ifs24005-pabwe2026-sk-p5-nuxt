import Swal from 'sweetalert2'
import type { SweetAlertResult } from 'sweetalert2'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatCurrency,
  formatDate,
  getErrorMessage,
  showConfirm,
  showError,
  showSuccess,
} from '~/helpers/toolsHelper'

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn() },
}))

const fire = vi.mocked(Swal.fire)

const result = (isConfirmed: boolean): SweetAlertResult => ({
  isConfirmed,
  isDenied: false,
  isDismissed: !isConfirmed,
})

describe('toolsHelper', () => {
  beforeEach(() => {
    fire.mockResolvedValue(result(true))
  })

  describe('showSuccess', () => {
    it('memakai judul default', async () => {
      await showSuccess('Data tersimpan')
      expect(fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'success', title: 'Berhasil', text: 'Data tersimpan', showConfirmButton: false }),
      )
    })

    it('memakai judul kustom', async () => {
      await showSuccess('Data tersimpan', 'Mantap')
      expect(fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Mantap' }))
    })
  })

  describe('showError', () => {
    it('memakai judul default', async () => {
      await showError('Ada masalah')
      expect(fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', title: 'Gagal', text: 'Ada masalah' }),
      )
    })

    it('memakai judul kustom', async () => {
      await showError('Ada masalah', 'Oops')
      expect(fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Oops' }))
    })
  })

  describe('showConfirm', () => {
    it('mengembalikan true saat dikonfirmasi, dengan label default', async () => {
      const confirmed = await showConfirm({ title: 'Hapus?' })
      expect(confirmed).toBe(true)
      expect(fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'warning',
          title: 'Hapus?',
          showCancelButton: true,
          confirmButtonText: 'Ya',
          cancelButtonText: 'Batal',
        }),
      )
    })

    it('mengembalikan false saat dibatalkan, dengan label kustom', async () => {
      fire.mockResolvedValue(result(false))
      const confirmed = await showConfirm({
        title: 'Hapus?',
        text: 'Tidak bisa dikembalikan',
        confirmText: 'Hapus',
        cancelText: 'Jangan',
      })
      expect(confirmed).toBe(false)
      expect(fire).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Tidak bisa dikembalikan',
          confirmButtonText: 'Hapus',
          cancelButtonText: 'Jangan',
        }),
      )
    })
  })

  describe('getErrorMessage', () => {
    it('mengambil pesan dari Error', () => {
      expect(getErrorMessage(new Error('Boom'))).toBe('Boom')
    })

    it('memakai pesan cadangan untuk nilai bukan Error', () => {
      expect(getErrorMessage('string')).toBe('Terjadi kesalahan yang tidak terduga.')
    })
  })

  describe('formatCurrency', () => {
    it('memformat rupiah tanpa desimal', () => {
      expect(formatCurrency(1500000).replace(/\u00a0/g, ' ')).toBe('Rp 1.500.000')
    })

    it('memformat nol', () => {
      expect(formatCurrency(0).replace(/\u00a0/g, ' ')).toBe('Rp 0')
    })
  })

  describe('formatDate', () => {
    it('memformat string ISO ke tanggal Indonesia (WIB)', () => {
      expect(formatDate('2026-10-09T05:00:00Z')).toBe('9 Oktober 2026')
    })

    it('menerima angka dan objek Date', () => {
      const date = new Date('2026-01-02T05:00:00Z')
      expect(formatDate(date)).toBe('2 Januari 2026')
      expect(formatDate(date.getTime())).toBe('2 Januari 2026')
    })

    it('mengembalikan tanda strip untuk tanggal tidak valid', () => {
      expect(formatDate('bukan tanggal')).toBe('-')
    })
  })
})
