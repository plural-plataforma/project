// src/components/Sidebar.tsx
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Avatar,
  IconButton,
  Paper,
  alpha
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  LibraryBooks as LibraryBooksIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material'
import logoPlural from '../../../../packages/ui/assets/images/logo-plural-plataforma.png'
import { ChartDonut, ClipboardText, Star, UsersThree } from '@phosphor-icons/react'

// Largura fixa do sidebar (padrão comum)
const drawerWidth = 277

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { text: 'Dashboard', icon: <ChartDonut size={20} weight="bold" />, path: '/dashboard' },
    { text: 'Usuários', icon: <UsersThree size={20} weight="fill" />, path: '/usuarios' }
  ]

  const cadastrosGroup = [
    { text: 'Habilidades', icon: <Star size={20} weight="fill" />, path: '/skills' },
    { text: 'Blocos de Avaliação', icon: <AssessmentIcon />, path: '/blocos' },
    { text: 'Banco de Atividades', icon: <ClipboardText size={20} weight="fill" />, path: '/atividades'
    }
  ]

  const sistemaGroup = [
    { text: 'Configurações', icon: <SettingsIcon />, path: '/configuracoes' },
    { text: 'Logs de Sistema', icon: <HistoryIcon />, path: '/logs' }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'white',
          borderRight: '1px solid',
          borderColor: 'grey.200'
        }
      }}
    >
      {/* Logo / Título da plataforma */}
      <Box
        sx={{
          height: 115,
          display: 'flex',
          alignItems: 'center',
          px: 10,
        }}
      >
        <Box
          component="img"
          src={logoPlural} // ou logoPlural.src se precisar
          alt="Plural Logo"
          sx={{ height: 40, width: 'auto' }}
        />
      </Box>

      <Box sx={{ overflowY: 'auto', flexGrow: 1, px: 1, py: 2 }}>
        <List>
          {menuItems.map(item => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  mx: 1,
                  mb: 0.5,
                  color: '#276678',
                  '&.Mui-selected': {
                    '&.Mui-selected': {
                      bgcolor: '#276678',
                      color: '#FFFFFF'
                    }
                  }
                }}
              >
                <ListItemIcon
                  sx={{ color: isActive(item.path) ? '#ffffff' : '#276678' }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* Grupo Cadastros */}
        <Typography
          variant="subtitle2"
          color='#9CA3AF'
          sx={{ px: 3, mb: 1, fontWeight: 600 }}
        >
          Cadastros
        </Typography>

        <List>
          {cadastrosGroup.map(item => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  mx: 1,
                  mb: 0.5,
                  color: '#276678',
                  '&.Mui-selected': {
                    '&.Mui-selected': {
                      bgcolor: '#276678',
                      color: '#FFFFFF'
                    }
                  }
                }}
              >
                <ListItemIcon
                  sx={{ color: isActive(item.path) ? '#ffffff' : '#276678' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* Grupo Sistema */}
        <Typography
          variant="subtitle2"
          color='#9CA3AF'
          gap='8px'
          sx={{ px: 3, mb: 1, fontWeight: 600 }}
        >
          Sistema
        </Typography>

        <List>
          {sistemaGroup.map(item => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  mx: 1,
                  mb: 0.5,
                  color: '#276678',
                  '&.Mui-selected': {
                    '&.Mui-selected': {
                      bgcolor: '#276678',
                      color: '#FFFFFF'
                    }
                  }
                }}
              >
                <ListItemIcon
                  sx={{ color: isActive(item.path) ? '#ffffff' : '#276678' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Perfil do administrador no rodapé */}
      <Paper
        elevation={0}
        sx={{
          m: 2,
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.200'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: '#276678' }}>AP</Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Admin Plural
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              fontSize="0.85rem"
            >
              admin@plural.com
            </Typography>
          </Box>

          <IconButton size="small">
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Drawer>
  )
}
