import '@testing-library/jest-dom/vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import { afterEach, beforeEach, vi } from 'vitest'

// Otomatis unmount semua komponen setelah tiap test
enableAutoUnmount(afterEach)

beforeEach(() => {
  // jsdom tidak mengimplementasikan scrollTo
  window.scrollTo = vi.fn()
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
  localStorage.clear()
  sessionStorage.clear()
})