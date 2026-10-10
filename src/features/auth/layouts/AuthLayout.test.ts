import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AuthLayout from '~/features/auth/layouts/AuthLayout.vue'

describe('AuthLayout', () => {
  it('menampilkan judul, subjudul, dan isi slot', () => {
    const wrapper = mount(AuthLayout, {
      props: { title: 'Masuk', subtitle: 'Selamat datang' },
      slots: { default: '<p id="isi">Konten form</p>' },
    })

    expect(wrapper.find('h1').text()).toBe('Masuk')
    expect(wrapper.text()).toContain('Selamat datang')
    expect(wrapper.find('#isi').text()).toBe('Konten form')
  })

  it('tidak menampilkan subjudul saat tidak diberikan', () => {
    const wrapper = mount(AuthLayout, { props: { title: 'Daftar' } })

    expect(wrapper.find('h1').text()).toBe('Daftar')
    expect(wrapper.find('p.mt-2').exists()).toBe(false)
  })
})
