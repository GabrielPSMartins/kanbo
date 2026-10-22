import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      // no docker-compose o backend é outro container (API_PROXY_TARGET=http://backend:8000)
      '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:8000',
    },
  },
})
