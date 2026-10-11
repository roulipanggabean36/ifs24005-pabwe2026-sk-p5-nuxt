import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ErrorPage from '~/error.vue'

const mountError = (statusCode: number, message: string) =>
  mount(ErrorPage, { props: { error: { statusCode, message } } })

describe('error.vue', () => {
  it('menampilkan pesan khusus untuk halaman yang tidak ditemukan', () => {
    const wrapper = mountError(404, 'Page not found: /abc')

    expect(wrapper.get('p').text()).toBe('404')
    expect(wrapper.get('h1').text()).toBe('Halaman tidak ditemukan')
    expect(wrapper.text()).toContain('Alamat yang Anda buka tidak ada')
    expect(wrapper.text()).not.toContain('Page not found: /abc')
  })

  it('menampilkan pesan error asli untuk kesalahan lain', () => {
    const wrapper = mountError(500, 'Terjadi gangguan pada server.')

    expect(wrapper.get('p').text()).toBe('500')
    expect(wrapper.get('h1').text()).toBe('Terjadi kesalahan')
    expect(wrapper.text()).toContain('Terjadi gangguan pada server.')
  })

  it('menyediakan tautan kembali ke beranda', () => {
    const link = mountError(500, 'Error').get('a')

    expect(link.attributes('href')).toBe('/')
    expect(link.text()).toBe('Kembali ke beranda')
  })
})
