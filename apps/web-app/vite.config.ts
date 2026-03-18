/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string }

// Resolve local node_modules to guarantee a single React instance
// in the monorepo (prevents "Invalid hook call" caused by duplicate React)
const localReact = path.resolve(__dirname, 'node_modules/react')
const localReactDom = path.resolve(__dirname, 'node_modules/react-dom')

const API_TARGET = process.env.VITE_API_URL?.replace(/\/+$/, '') ?? 'https://dev-api.runasp.net/api'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    host: true,
    proxy: {
      // Todas as chamadas /api/* são encaminhadas para a API .NET, sem CORS em dev
      '/api': {
        target: API_TARGET.replace(/\/api$/, ''),
        changeOrigin: true,
        secure: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Force all packages (incl. hoisted @tanstack, zustand, etc.)
      // to use this app's local React installation
      'react': localReact,
      'react-dom': localReactDom,
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime'),
    },
    dedupe: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'react-hook-form',
      'framer-motion',
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*'],
    },
  },
})
