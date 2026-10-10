import tailwindcss from '@tailwindcss/vite'
import { defineNuxtConfig } from 'nuxt/config'

const DEFAULT_BASEURL = 'https://open-api.delcom.org/api/v1'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Mode SPA
  ssr: false,

  // Semua source berada di folder src/
  srcDir: 'src/',

  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  // Rute dikelola manual lewat src/router.options.ts
  pages: true,

  // Wajib explicit import agar kode identik antara Nuxt dan Vitest
  imports: { autoImport: false },
  components: false,

  css: ['~/index.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'Delcom Cash Flow',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Delcom Cash Flow: catat dan pantau arus kas pemasukan dan pengeluaran.',
        },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },

  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.DELCOM_BASEURL': JSON.stringify(
        process.env.DELCOM_BASEURL ?? DEFAULT_BASEURL,
      ),
    },
  },

  typescript: {
    strict: true,
    typeCheck: false, // gunakan `bun run typecheck` secara manual
  },
})