import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        analytics: resolve(__dirname, 'public/analytics.html'),
      },
    },
  },
})