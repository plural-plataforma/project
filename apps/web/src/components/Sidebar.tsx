// components/Sidebar.tsx
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Divider, Avatar, Typography, IconButton } from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import StarIcon from '@mui/icons-material/Star'
import AssessmentIcon from '@mui/icons-material/Assessment'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import { useNavigate, useLocation } from 'react-router-dom'

interface SidebarProps {
  activeRoute?: string
  onSignOut: () => void
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Usuários', icon: <PeopleIcon />, path: '/usuarios' },
  { text: 'Habilidades', icon: <StarIcon />, path: '/skills' },
  { text: 'Blocos de Atividades', icon: <AssessmentIcon />, path: '/blocos-atividades' },
  { text: 'Banco de Atividades', icon: <LibraryBooksIcon />, path: '/banco-atividades' },
  { text: 'Configurações', icon: <SettingsIcon />, path: '/configuracoes' },
]

export default function Sidebar({ activeRoute = '', onSignOut }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => activeRoute ? activeRoute === path : location.pathname === path

  return (
    <Box
      component="nav"
      sx={{
        width: 260,
        flexShrink: 0,
        position: 'fixed',
        height: '100vh',
        borderRight: '1px solid',
        borderColor: 'grey.200',
        bgcolor: 'white',
        overflowY: 'auto',
        pt: '64px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Menu principal */}
      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            selected={isActive(item.path)}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              py: 1.2,
              '&.Mui-selected': {
                bgcolor: '#276678',
                color: 'white',
                '&:hover': { bgcolor: '#1e4e5a' },
                '& .MuiListItemIcon-root': { color: 'white' },
              },
              '&:hover': {
                bgcolor: 'grey.100',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 44, color: 'text.secondary' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{ 
                fontSize: '0.95rem',
                fontWeight: isActive(item.path) ? 600 : 500
              }}
            />
          </ListItemButton>
        ))}
      </List>

      {/* Footer com informações do usuário */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'grey.200', mt: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: '#276678',
              fontSize: '1.1rem',
            }}
          >
            AP
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Admin Plural
            </Typography>
            <Typography variant="caption" color="text.secondary">
              admin@plural.com
            </Typography>
          </Box>

          <IconButton 
            size="small" 
            onClick={onSignOut}
            sx={{ color: 'text.secondary' }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}