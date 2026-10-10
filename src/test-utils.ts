import { createTestingPinia } from '@pinia/testing'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import type { GlobalMountOptions } from '@vue/test-utils'
import { vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Router, RouteRecordRaw } from 'vue-router'
import { defineComponent, h } from 'vue'
import type { Component, DefineComponent } from 'vue'

export interface RenderOptions {
  /** State awal store Pinia, contoh: { auth: { token: 'abc' } } */
  initialState?: Record<string, unknown>
  /** true = semua action store di-stub (default). false = action asli dijalankan */
  stubActions?: boolean
  props?: Record<string, unknown>
  slots?: Record<string, string>
  /** Router asli (memory history). Jika diisi, RouterLink tidak di-stub */
  router?: Router
  global?: GlobalMountOptions
}

const BlankPage = defineComponent({ render: () => h('div') })

/** Router in-memory untuk menguji navigasi tanpa browser */
export function createMockRouter(
  routes: RouteRecordRaw[] = [{ path: '/:pathMatch(.*)*', component: BlankPage }],
): Router {
  return createRouter({ history: createMemoryHistory(), routes })
}

/** Mount komponen dengan Pinia testing (spy via vi.fn) dan stub RouterLink/NuxtLink */
export function renderWithProviders(component: Component, options: RenderOptions = {}) {
  const { initialState, stubActions = true, props, slots, router, global = {} } = options

  const pinia = createTestingPinia({
    initialState,
    stubActions,
    createSpy: vi.fn,
  })

  const wrapper = mount(component as DefineComponent, {
    props,
    slots,
    global: {
      ...global,
      plugins: [pinia, ...(router ? [router] : []), ...(global.plugins ?? [])],
      stubs: {
        ...(router ? {} : { RouterLink: RouterLinkStub, NuxtLink: RouterLinkStub }),
        ...global.stubs,
      },
    },
  })

  return { wrapper, pinia, router }
}

export { flushPromises }