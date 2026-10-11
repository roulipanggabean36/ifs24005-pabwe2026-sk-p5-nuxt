import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

const DEFAULT_BASEURL = 'https://open-api.delcom.org/api/v1'
const srcPath = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],

    // Sama dengan nuxt.config.ts supaya import.meta.env.DELCOM_BASEURL tersedia di test
    define: {
      'import.meta.env.DELCOM_BASEURL': JSON.stringify(env.DELCOM_BASEURL ?? DEFAULT_BASEURL),
    },

    // Sama dengan alias Nuxt (~ dan @ menunjuk ke srcDir)
    resolve: {
      alias: {
        '~': srcPath,
        '@': srcPath,
      },
    },

    test: {
      environment: 'jsdom',
      globals: false,
      include: ['src/**/*.test.ts'],
      setupFiles: ['./src/setupTests.ts'],
      clearMocks: true,
      restoreMocks: true,
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,vue}'],
        exclude: [
          'src/**/*.test.ts',
          'src/**/*.d.ts',
          'src/setupTests.ts',
          'src/test-utils.ts',
          // Entry point tipis Nuxt yang bergantung pada modul virtual (#app, #components)
          'src/app.vue',
          'src/plugins/**',
        ],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  }
})
