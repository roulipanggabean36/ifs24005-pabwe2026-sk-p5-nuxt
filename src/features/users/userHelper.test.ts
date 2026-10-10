import { describe, expect, it } from 'vitest'
import { getInitial, resolvePhotoUrl } from '~/features/users/userHelper'

const BASE = 'https://open-api.delcom.org/api/v1'

describe('resolvePhotoUrl', () => {
  it('mengembalikan null saat photo null', () => {
    expect(resolvePhotoUrl(null, BASE)).toBeNull()
  })

  it('mengembalikan null saat photo string kosong', () => {
    expect(resolvePhotoUrl('', BASE)).toBeNull()
  })

  it.each(['http://127.0.0.1:8000/default/img/user.png', 'https://cdn.delcom.org/a.png'])(
    'mengembalikan URL penuh apa adanya: %s',
    (url) => {
      expect(resolvePhotoUrl(url, BASE)).toBe(url)
    },
  )

  it('menggabungkan path relatif dengan origin API', () => {
    expect(resolvePhotoUrl('img/profile/3_1709251633.png', BASE)).toBe(
      'https://open-api.delcom.org/img/profile/3_1709251633.png',
    )
  })

  it('membuang garis miring di awal path relatif', () => {
    expect(resolvePhotoUrl('/img/profile/3.png', BASE)).toBe(
      'https://open-api.delcom.org/img/profile/3.png',
    )
  })

  it('menangani base URL dengan garis miring di akhir', () => {
    expect(resolvePhotoUrl('img/a.png', `${BASE}/`)).toBe('https://open-api.delcom.org/img/a.png')
  })

  it('menangani base URL tanpa segmen /api/vN', () => {
    expect(resolvePhotoUrl('img/a.png', 'https://host.test/')).toBe('https://host.test/img/a.png')
  })
})

describe('getInitial', () => {
  it('mengambil huruf pertama dalam huruf kapital', () => {
    expect(getInitial('budi')).toBe('B')
  })

  it('mengabaikan spasi di awal nama', () => {
    expect(getInitial('  ani')).toBe('A')
  })

  it.each(['', '   '])('mengembalikan "?" untuk nama kosong: "%s"', (name) => {
    expect(getInitial(name)).toBe('?')
  })
})
