import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BaseModal from '~/features/cashflows/modals/BaseModal.vue'

const mountModal = (open = true) =>
  mount(BaseModal, {
    props: { open, title: 'Judul modal' },
    slots: { default: '<p data-testid="isi">Isi modal</p>' },
    attachTo: document.body,
  })

describe('BaseModal', () => {
  it('tidak merender apa pun saat tertutup', () => {
    const wrapper = mountModal(false)

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('menampilkan dialog dengan judul dan isi saat terbuka', () => {
    const wrapper = mountModal()

    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(wrapper.get('h2').text()).toBe('Judul modal')
    expect(wrapper.get('[data-testid="isi"]').text()).toBe('Isi modal')
  })

  it('menghubungkan dialog dengan judulnya lewat aria-labelledby', () => {
    const wrapper = mountModal()

    const headingId = wrapper.get('h2').attributes('id')
    expect(headingId).toBeTruthy()
    expect(wrapper.get('[role="dialog"]').attributes('aria-labelledby')).toBe(headingId)
  })

  it('mengirim close saat latar belakang diklik', async () => {
    const wrapper = mountModal()

    await wrapper.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('tidak mengirim close saat isi dialog diklik', async () => {
    const wrapper = mountModal()

    await wrapper.get('[role="dialog"]').trigger('click')
    await wrapper.get('[data-testid="isi"]').trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('mengirim close saat tombol tutup diklik', async () => {
    const wrapper = mountModal()

    await wrapper.get('button[aria-label="Tutup"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('mengirim close saat tombol Escape ditekan', async () => {
    const wrapper = mountModal()

    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('memindahkan fokus ke dialog saat dibuka sejak awal', async () => {
    const wrapper = mountModal()
    await flushPromises()

    expect(document.activeElement).toBe(wrapper.get('[role="dialog"]').element)
  })

  it('memindahkan fokus ke dialog saat dibuka belakangan dan menghilang saat ditutup', async () => {
    const wrapper = mountModal(false)

    await wrapper.setProps({ open: true })
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('[role="dialog"]').element)

    await wrapper.setProps({ open: false })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })
})
