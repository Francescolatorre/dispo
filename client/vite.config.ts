import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    },
    watch: {
      usePolling: true,
      interval: 1000, // Check for changes every second
      threshold: 1000 // Batch changes
    }
  }
})
