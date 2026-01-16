// src/components/layouts/AdminLayout.tsx
import { Box } from '@mui/material'
import Header from '../Header'         // seu header atualizado
import Sidebar from '../Sidebar'       // sua sidebar atualizada

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Sidebar fixa à esquerda */}
      <Sidebar 
        activeRoute={window.location.pathname} // ou use useLocation se preferir
        onSignOut={() => {
          // sua lógica de logout aqui
          localStorage.removeItem('token')
          window.location.href = '/'
        }}
      />

      {/* Área principal: header fixo + conteúdo com scroll */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header fixo no topo */}
        <Header />

        {/* Conteúdo da página - com margem para não sobrepor header/sidebar */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: { md: '260px' },      // mesma largura da sidebar
            mt: '64px',               // altura do header
            p: { xs: 2, md: 4 },
            overflowY: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}