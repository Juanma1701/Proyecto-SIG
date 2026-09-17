import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/amva': {
        target: 'https://portalidem.metropol.gov.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/amva/, ''),
      },
      '/sim': {
        target: 'https://sim.metropol.gov.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/sim/, ''),
      },
    },
  },
})