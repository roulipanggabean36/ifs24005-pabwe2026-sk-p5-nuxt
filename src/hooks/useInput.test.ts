import { describe, expect, it } from 'vitest'
import { useInput } from '~/hooks/useInput'

const typeInto = (onInput: (event: Event) => void, newValue: string): void => {
  const input = document.createElement('input')
  input.addEventListener('input', onInput)
  input.value = newValue
  input.dispatchEvent(new Event('input'))
}

describe('useInput', () => {
  it('dimulai dari nilai awal', () => {
    const { value } = useInput('halo')
    expect(value.value).toBe('halo')
  })

  it('memperbarui nilai string dari event input', () => {
    const { value, onInput } = useInput('')
    typeInto(onInput, 'Gaji bulanan')
    expect(value.value).toBe('Gaji bulanan')
  })

  it('mengonversi ke angka saat nilai awal berupa number', () => {
    const { value, onInput } = useInput(0)
    typeInto(onInput, '2500')
    expect(value.value).toBe(2500)
  })

  it('mengembalikan nilai ke awal lewat reset', () => {
    const { value, onInput, reset } = useInput('awal')
    typeInto(onInput, 'berubah')
    expect(value.value).toBe('berubah')
    reset()
    expect(value.value).toBe('awal')
  })
})
