import type { RouterConfig } from '@nuxt/schema'
import { routes } from '~/routes'

export default {
  // Rute dikelola manual di src/routes.ts; rute otomatis dari folder pages diabaikan
  routes: () => routes,
} satisfies RouterConfig
