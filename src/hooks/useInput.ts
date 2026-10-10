import { ref } from 'vue'
import type { Ref } from 'vue'

export interface UseInputReturn<T extends string | number> {
  value: Ref<T>
  onInput: (event: Event) => void
  reset: () => void
}

type InputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export function useInput<T extends string | number = string>(initialValue: T): UseInputReturn<T> {
  const value = ref(initialValue) as Ref<T>

  const onInput = (event: Event): void => {
    const raw = (event.target as InputElement).value
    value.value = (typeof initialValue === 'number' ? Number(raw) : raw) as T
  }

  const reset = (): void => {
    value.value = initialValue
  }

  return { value, onInput, reset }
}
