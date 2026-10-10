/**
 * Mengubah nilai `photo` dari API menjadi URL yang bisa dipakai <img>.
 * API mengembalikan URL penuh (daftar user) atau path relatif (profil saya).
 */
export const resolvePhotoUrl = (photo: string | null, baseUrl: string): string | null => {
  if (!photo) return null
  if (/^https?:\/\//i.test(photo)) return photo

  const origin = baseUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/+$/, '')
  return `${origin}/${photo.replace(/^\/+/, '')}`
}

/** Huruf pertama nama (kapital) untuk avatar pengganti foto */
export const getInitial = (name: string): string => name.trim().charAt(0).toUpperCase() || '?'
