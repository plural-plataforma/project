import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 8082,

  },

  resolve: {
    alias: {
      'zod/v4/core': 'zod', 
    },
  },
})