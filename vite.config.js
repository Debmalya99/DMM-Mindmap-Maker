import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'resources',
    emptyOutDir: true,
  },
})
