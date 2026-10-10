import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UserAvatar from '~/features/users/components/UserAvatar.vue'

const PHOTO = 'https://cdn.delcom.org/budi.png'

describe('UserAvatar', () => {
  it('menampilkan foto saat photo berupa URL penuh', () => {
    const wrapper = mount(UserAvatar, { props: { name: 'Budi', photo: PHOTO } })

    const img = wrapper.get('img')
    expect(img.attributes('src')).toBe(PHOTO)
    expect(img.attributes('alt')).toBe('Foto profil Budi')
  })

  it('mengubah path relatif menjadi URL absolut', () => {
    const wrapper = mount(UserAvatar, { props: { name: 'Budi', photo: 'img/profile/3.png' } })

    const src = wrapper.get('img').attributes('src')
    expect(src).toMatch(/\/img\/profile\/3\.png$/)
    expect(src).not.toContain('/api/v1/img')
  })

  it.each([null, undefined])('menampilkan inisial saat photo %s', (photo) => {
    const wrapper = mount(UserAvatar, { props: { name: 'budi', photo } })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('B')
  })

  it('menampilkan "?" saat nama kosong', () => {
    const wrapper = mount(UserAvatar, { props: { name: '' } })

    expect(wrapper.text()).toBe('?')
  })

  it('beralih ke inisial saat foto gagal dimuat', async () => {
    const wrapper = mount(UserAvatar, { props: { name: 'Budi', photo: PHOTO } })

    await wrapper.get('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('B')
  })

  it('mencoba memuat foto lagi saat prop photo berubah', async () => {
    const wrapper = mount(UserAvatar, { props: { name: 'Budi', photo: PHOTO } })
    await wrapper.get('img').trigger('error')

    await wrapper.setProps({ photo: 'https://cdn.delcom.org/baru.png' })

    expect(wrapper.get('img').attributes('src')).toBe('https://cdn.delcom.org/baru.png')
  })

  it('meneruskan class dari pemanggil', () => {
    const wrapper = mount(UserAvatar, {
      props: { name: 'Budi' },
      attrs: { class: 'h-12 w-12' },
    })

    expect(wrapper.classes()).toContain('h-12')
  })
})
