import { defineNuxtPlugin, useRouter } from '#app'
import { authGuard } from '~/guards'

// Pemasangan tipis ke Nuxt; logikanya ada (dan diuji) di src/guards.ts
export default defineNuxtPlugin(() => {
  useRouter().beforeEach(authGuard)
})
