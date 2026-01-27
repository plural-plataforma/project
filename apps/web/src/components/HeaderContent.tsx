import { Box, Typography, InputBase, alpha, IconButton } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useLocation } from 'react-router-dom'

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
}

export default function HeaderContent() {
  const location = useLocation()

  const currentPage = pageInfo[location.pathname] || {
    title: 'Plural Plataforma',
    description: 'Gerencie sua plataforma educacional'
  }

  return (
    <Box
      sx={{
        width: '100%',
        borderBottom: '0 solid #E5E7EB'
      }}
    >
      {/* Container interno */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          //maxWidth: 1184,
          mx: 'auto',
          px: '32px',     // ✅ padding lateral do Figma
          py: '16px',     // ✅ padding vertical do Figma
          gap: '16px'
        }}
      >
        {/* Esquerda */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              color: '#276678',
              fontSize: 20,
              fontWeight: 700,
              lineHeight: '24px'
            }}
          >
            {currentPage.title}
          </Typography>

          <Typography
            sx={{
              color: '#6B7280',
              fontWeight: 400,
              fontSize: 14,
              lineHeight: '20px'
            }}
          >
            {currentPage.description}
          </Typography>
        </Box>

        {/* Direita */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexShrink: 0
          }}
        >
          {/* Busca */}
          <Box sx={{ position: 'relative', width: 320 }}>
            <InputBase
              placeholder="Buscar..."
              fullWidth
              sx={{
                height: 40,
                pl: 5,
                pr: 2,
                border: '1px solid #2766786B',
                borderRadius: '8px',
                fontSize: 14,
                bgcolor: '#FFF'
              }}
              startAdornment={
                <SearchIcon
                  sx={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 20,
                    color: '#64748B'
                  }}
                />
              }
            />
          </Box>

          {/* Sino */}
          <IconButton>
            <NotificationsIcon sx={{ color: '#9CA3AF' }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}
