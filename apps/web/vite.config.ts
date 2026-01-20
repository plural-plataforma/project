import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8082,
  },
  define: {
    // Expõe variáveis do .env no frontend
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  },
  resolve: {
    alias: {
      'zod/v4/core': 'zod', 
    },
  },
})
