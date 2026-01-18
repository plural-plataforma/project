// components/HeaderContent.tsx
import { Box, Typography, InputBase, alpha, IconButton } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useLocation } from 'react-router-dom'

// Mapeamento de títulos e descrições por rota
const pageInfo: Record<string, { title: string; description: string }> = {
  '/dashboard': {
    title: 'Dashboard Administrativo',
    description: 'Gerencie sua plataforma Plural'
  },
  '/usuarios': {
    title: 'Gerenciamento de Usuários',
    description: 'Gerencie todos os usuários da plataforma Plural'
  },
  '/skills': {
    title: 'Gerenciamento de Habilidades',
    description: 'Gerencie e monitore todas as habilidades cadastradas'
  },
  '/blocos': {
    title: 'Gerenciamento de Blocos de Atividades',
    description: 'Gerencie todos os blocos de atividades do sistema'
  },
  '/atividades': {
    title: 'Gerenciamento do Banco de Atividades',
    description: 'Gerencie todos os bancos de atividades do sistema'
  }
  // Adicione outras rotas conforme necessário
}

export default function HeaderContent() {
  const location = useLocation()

  const currentPage = pageInfo[location.pathname] || {
    title: 'Plural Plataforma',
    description: 'Gerencie sua plataforma educacional'
  }

  const handleNotificationsClick = () => {
    console.log('Notificações clicadas')
    // Aqui você pode abrir um menu de notificações, modal, etc.
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 1184,
        maxHeight: 84,
        // mx: 'auto',
        px: { xs: 2, lg: 0 },
        pb: 4,
        py: 3,
        gap: 2
      }}
    >
      {/* Esquerda: Título + Descrição */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="h5"
          sx={{
            color: '#276678',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
            mb: 0.5
          }}
        >
          {currentPage.title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: '#6B7280',
            display: { xs: 'none', md: 'block' }
          }}
        >
          {currentPage.description}
        </Typography>
      </Box>

      {/* Direita: Busca + Notificações */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        {/* Campo de busca */}
        <Box
          sx={{
            position: 'relative',
            width: { xs: 180, sm: 240, md: 320, lg: 380 }
          }}
        >
          <InputBase
            placeholder="Buscar..."
            fullWidth
            sx={{
              height: 42,
              pl: 5,
              pr: 2,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: alpha('#276678', 0.3),
              borderRadius: '8px',
              fontSize: 15,
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: alpha('#276678', 0.6),
                boxShadow: '0 0 0 3px rgba(39, 102, 120, 0.08)'
              },
              '&.Mui-focused': {
                borderColor: '#276678',
                boxShadow: '0 0 0 3px rgba(39, 102, 120, 0.15)'
              },
              '& input::placeholder': {
                color: '#9CA3AF',
                opacity: 1
              }
            }}
            startAdornment={
              <SearchIcon
                sx={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#276678',
                  fontSize: 20
                }}
              />
            }
          />
        </Box>

        {/* Botão de notificações */}
        <IconButton
          onClick={handleNotificationsClick}
          size="medium"
          sx={{
            color: '#9CA3AF',
            '&:hover': { color: '#276678', bgcolor: alpha('#276678', 0.08) }
          }}
        >
          <NotificationsIcon />
        </IconButton>
      </Box>
    </Box>
  )
}
