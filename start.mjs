import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const entry = resolve(root, '.output/server/index.mjs')
const forceBuild = process.argv.includes('--build')

// Node >= 20.12 punya loadEnvFile; Bun sudah memuat .env otomatis
try {
  process.loadEnvFile?.(resolve(root, '.env'))
} catch {
  // .env tidak ditemukan: gunakan environment bawaan
}

if (forceBuild || !existsSync(entry)) {
  console.log('[start] Membangun aplikasi (bun run build)...')
  const build = spawnSync('bun', ['run', 'build'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (build.status !== 0) {
    console.error('[start] Build gagal. Server tidak dijalankan.')
    process.exit(build.status ?? 1)
  }
}

process.env.PORT ??= '3000'
process.env.HOST ??= '127.0.0.1'

console.log(`[start] Menjalankan server di http://localhost:${process.env.PORT}`)
await import(pathToFileURL(entry).href)