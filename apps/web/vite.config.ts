import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Necessário para ESModules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Carregar o .env que está um nível acima
dotenv.config({
  path: path.join(__dirname, '..','..', '.env')
})

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
<<<<<<< HEAD
      'zod/v4/core': 'zod', 
    },
=======
      'zod/v4/core': 'zod',
    },
    
  },
  optimizeDeps: {
    include: ['zod', '@hookform/resolvers', '@hookform/resolvers/zod'],
>>>>>>> ba8249a355ddb9e52c673718bb4f85e1d9b0c7b1
  },
})
