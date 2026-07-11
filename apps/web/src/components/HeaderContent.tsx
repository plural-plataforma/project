import { Box, Typography, InputBase, IconButton, useTheme } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import NotificationsIcon from '@mui/icons-material/Notifications'
import MenuIcon from '@mui/icons-material/Menu'
import { useLocation } from 'react-router-dom'

interface PageInfoEntry {
  prefix: string
  title: string
  description: string
}

// Ordem importa: prefixos mais específicos primeiro (ex.: '/skills/new' antes de '/skills')
const pageInfoList: PageInfoEntry[] = [
  { prefix: '/dashboard', title: 'Dashboard Administrativo', description: 'Gerencie sua plataforma Plural' },
  { prefix: '/usuarios', title: 'Gerenciamento de Usuários', description: 'Gerencie todos os usuários da plataforma Plural' },
  { prefix: '/skills', title: 'Gerenciamento de Habilidades', description: 'Gerencie e monitore todas as habilidades cadastradas' },
  { prefix: '/blocos', title: 'Gerenciamento de Blocos de Avaliação', description: 'Gerencie todos os blocos de avaliação do sistema' },
  { prefix: '/atividades', title: 'Gerenciamento do Banco de Atividades', description: 'Gerencie todas as atividades do sistema' },
  { prefix: '/configuracoes', title: 'Configurações', description: 'Configurações gerais da plataforma' },
  { prefix: '/change-password', title: 'Alterar Senha', description: 'Atualize sua senha de acesso' },
]

const DEFAULT_PAGE_INFO = {
  title: 'Plural Plataforma',
  description: 'Gerencie sua plataforma educacional',
}

function getPageInfo(pathname: string) {
  const match = pageInfoList.find(
    (page) => pathname === page.prefix || pathname.startsWith(`${page.prefix}/`)
  )
  return match ?? DEFAULT_PAGE_INFO
}

interface HeaderContentProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export default function HeaderContent({ onMenuClick, showMenuButton }: HeaderContentProps) {
  const location = useLocation()
  const theme = useTheme()
  const currentPage = getPageInfo(location.pathname)

  return (
    <Box
      sx={{
        width: '100%',
        borderBottom: '0 solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mx: 'auto',
          px: '32px',
          py: '16px',
          gap: '16px',
        }}
      >
        {showMenuButton && (
          <IconButton onClick={onMenuClick} sx={{ color: 'primary.main' }} aria-label="Abrir menu">
            <MenuIcon />
          </IconButton>
        )}

        {/* Esquerda */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              color: theme.palette.primary.main,
              fontSize: 20,
              fontWeight: 700,
              lineHeight: '24px',
            }}
            noWrap
          >
            {currentPage.title}
          </Typography>

          <Typography
            sx={{
              color: 'text.secondary',
              fontWeight: 400,
              fontSize: 14,
              lineHeight: '20px',
            }}
            noWrap
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
            flexShrink: 0,
          }}
        >
          {/* Busca — oculta em telas pequenas para dar espaço ao título */}
          <Box sx={{ position: 'relative', width: 320, display: { xs: 'none', sm: 'block' } }}>
            <InputBase
              placeholder="Buscar..."
              fullWidth
              sx={{
                height: 40,
                pl: 5,
                pr: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                fontSize: 14,
                bgcolor: '#FFF',
              }}
              startAdornment={
                <SearchIcon
                  sx={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 20,
                    color: 'text.secondary',
                  }}
                />
              }
            />
          </Box>

          <IconButton>
            <NotificationsIcon sx={{ color: 'text.secondary' }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}
