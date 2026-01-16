// components/Header.tsx
import { useLocation } from 'react-router-dom'
import { AppBar, Toolbar, Box, IconButton, InputBase, Avatar, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'

// Tipo explícito (ajuda o TS a entender melhor)
interface PageInfo {
  title: string
  description: string
}

const pageInfo: Record<string, PageInfo> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'Visão geral da plataforma Plural',
  },
  '/usuarios': {
    title: 'Gerenciamento de Usuários',
    description: 'Gerencie todos os usuários da plataforma Plural',
  },
  '/skills': {
    title: 'Gerenciamento de Habilidades',
    description: 'Adicione, edite ou desabilite habilidades da plataforma',
  },
  '/blocos-atividades': {
    title: 'Gerenciamento de Blocos de Atividades',
    description: 'Crie e configure blocos para avaliações diagnósticas',
  },
  '/banco-atividades': {
    title: 'Gerenciamento do Banco de Atividades',
    description: 'Gerencie todos os banco de atividades do sistema',
  },
  '/configuracoes': {
    title: 'Configurações',
    description: 'Ajustes gerais do sistema',
  },
  // Adicione outras rotas aqui
}
export default function Header() {
  const location = useLocation()
  
  // Pega as informações da página atual ou usa fallback
  const currentPage = pageInfo[location.pathname] || {
    title: 'Plural Plataforma',
    description: 'Gerencie sua plataforma educacional',
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'white',
        borderBottom: '1px solid',
        borderColor: 'grey.200',
        color: 'text.primary',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar 
        sx={{ 
          minHeight: 64, 
          px: { xs: 2, md: 4 }, 
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        {/* Esquerda: Logo + Título da página */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img
            src="/logo-plural-plataforma.png"
            alt="Plural"
            style={{ height: 38 }}
          />
          
          <Box sx={{flexDirection: 'column' , gap: 2.5}}>
            <Typography 
              variant="h6" 
              fontWeight="bold" 
              color="#276678"
              sx={{ lineHeight: 1.2 }}
            >
              {currentPage.title}
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ display: { xs: 'none', md: 'block' } }}
            >
              {currentPage.description}
            </Typography>
          </Box>
        </Box>

        {/* Centro: Busca */}
        <Box
          sx={{
            flex: 1,
            maxWidth: 420,
            mx: { md: 4 },
            display: { xs: 'none', sm: 'flex',  },
            alignItems: 'center',
            bgcolor: 'grey.100',
            borderRadius: 20,
            px: 4,
            py: 0.5,
            gap: 1,
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
          <InputBase
            placeholder="Buscar..."
            fullWidth
            sx={{ 
              color: 'text.primary',
              fontSize: '0.95rem',
            }}
          />
        </Box>

        {/* Direita: Notificações + Avatar/Admin Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <NotificationsNoneOutlinedIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}