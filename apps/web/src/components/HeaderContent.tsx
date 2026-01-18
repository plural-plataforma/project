// components/HeaderContent.tsx
import { Box, Typography, InputBase, alpha, Button } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useLocation } from 'react-router-dom'
import { Add } from '@mui/icons-material'

// Mapeamento de títulos e descrições por rota
// Você pode expandir conforme necessário
const pageInfo: Record<string, { title: string; description: string }> = {
  '/dashboard': {
    title: 'Dashboard Administrativo',
    description: 'Gerencie a Plural Plataforma de forma eficiente'
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
    description: 'Gerencie todos os banco de atividades do sistema'
  }
  // adicione outras rotas aqui
}

export default function HeaderContent() {
  const location = useLocation()

  // Pega título e descrição da rota atual ou fallback
  const currentPage = pageInfo[location.pathname] || {
    title: 'Plural Plataforma',
    description: 'Gerencie sua plataforma educacional'
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 1184,
        maxHeight: 89,
        height: '100%'
      }}
    >
      {/* Esquerda - Título + descrição */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          mt: '16px',
          
          ml: { lg: '32px', xs: '16px'},
          paddingBlockEnd: '16px'
        }}
      >
        <Typography
          sx={{
            color: '#276678',
            fontWeight: 700,
            fontSize: { xs: 20, md: 22, lg: 24 },
            lineHeight: '32px',
            letterSpacing: '-0.5px',
            whiteSpace: 'nowrap'
          }}
        >
          {currentPage.title}
        </Typography>

        <Typography
          sx={{
            color: '#6B7280',
            fontSize: 14,
            lineHeight: '20px',
            letterSpacing: '-0.5px',
            display: { xs: 'none', md: 'block' }
          }}
        >
          {currentPage.description}
        </Typography>
      </Box>

      {/* Direita - Busca */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          mt: '22px',
          flexShrink: 0
        }}
      >
        <Box
          sx={{ position: 'relative', width: { xs: 220, sm: 280, md: 340 } }}
        >
          <InputBase
            placeholder="Buscar..."
            fullWidth
            sx={{
              height: 42,
              pl: '40px',
              pr: 2,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: alpha('#276678', 0.42),
              borderRadius: '8px',
              fontSize: 16,
              '& input::placeholder': {
                color: '#ADAEBc',
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
        {/* Botão de ação principal (opcional por página) */}
        {/* Você pode condicionar o botão aqui conforme a rota, exemplo: */}
        {location.pathname === '/skills' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ bgcolor: '#276678', height: 44 }}
          >
            Nova Habilidade
          </Button>
        )}{' '}
        *
      </Box>
    </Box>
  )
}
