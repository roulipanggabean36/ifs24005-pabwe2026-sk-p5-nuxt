import Swal from 'sweetalert2'

export interface ConfirmOptions {
  title: string
  text?: string
  confirmText?: string
  cancelText?: string
}

const BRAND_COLOR = '#4f46e5'

export const showSuccess = (message: string, title = 'Berhasil') =>
  Swal.fire({
    icon: 'success',
    title,
    text: message,
    timer: 2000,
    showConfirmButton: false,
  })

export const showError = (message: string, title = 'Gagal') =>
  Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonColor: BRAND_COLOR,
  })

export const showConfirm = async ({
  title,
  text,
  confirmText = 'Ya',
  cancelText = 'Batal',
}: ConfirmOptions): Promise<boolean> => {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: BRAND_COLOR,
  })
  return result.isConfirmed
}

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak terduga.'

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)

export const formatDate = (value: string | number | Date): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date)
}
