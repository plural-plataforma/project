import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import theme from './theme/theme'
import { queryClient } from './lib/queryClient'
import App from './App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find the root element. Check if index.html has <div id="root"></div>')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)