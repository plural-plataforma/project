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
  Typography,
  Avatar,
  IconButton,
  Paper,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import logoPlural from '../../../../packages/ui/assets/images/logo-plural-plataforma.png'
import { ChartDonut, ClipboardText, SignOut, Star, UsersThree } from '@phosphor-icons/react'
import { useEffect, useState, type ReactNode } from 'react'

// Largura fixa do sidebar (padrão comum)
export const drawerWidth = 350

interface SidebarProps {
  variant?: 'permanent' | 'temporary'
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ variant = 'permanent', open = true, onClose }: SidebarProps) {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<{
    nome: string;
    email: string;
  } | null>(null);

  const menuItems = [
    { text: 'Dashboard', icon: <ChartDonut size={20} weight="bold" />, path: '/dashboard' },
    { text: 'Usuários', icon: <UsersThree size={20} weight="fill" />, path: '/usuarios' }
  ]

  const cadastrosGroup = [
    { text: 'Habilidades', icon: <Star size={20} weight="fill" />, path: '/skills' },
    { text: 'Blocos de Avaliação', icon: <AssessmentIcon />, path: '/blocos' },
    {
      text: 'Banco de Atividades', icon: <ClipboardText size={20} weight="fill" />, path: '/atividades'
    }
  ]

  const sistemaGroup = [
    { text: 'Configurações', icon: <SettingsIcon />, path: '/configuracoes' },
  ]

  // Ativo também em sub-rotas (ex.: /skills/new, /blocos/:id) — não só na rota exata
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)

  const handleNavigate = (path: string) => {
    navigate(path)
    if (variant === 'temporary') onClose?.()
  }

  useEffect(() => {
    const userString = localStorage.getItem('user')|| sessionStorage.getItem('user');
    if (userString) {
      try {
        setUser(JSON.parse(userString));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('user')
    navigate('/login')
  }
  
  const getInitials = (name?: string) => {
    if (!name) return 'AP';
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`
      : parts[0][0];
  };

  const renderGroup = (items: { text: string; icon: ReactNode; path: string }[]) => (
    <List>
      {items.map(item => (
        <ListItem key={item.text} disablePadding>
          <ListItemButton
            selected={isActive(item.path)}
            onClick={() => handleNavigate(item.path)}
            sx={{
              borderRadius: 1.5,
              mx: 1,
              mb: 0.5,
              color: 'primary.main',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
              },
            }}
          >
            <ListItemIcon
              sx={{ color: isActive(item.path) ? 'primary.contrastText' : 'primary.main' }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  )

  const drawerContent = (
    <>
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
          src={logoPlural}
          alt="Plural Logo"
          sx={{ height: 40, width: 'auto' }}
        />
      </Box>

      <Box sx={{ overflowY: 'auto', flexGrow: 1, px: 1, py: 2 }}>
        {renderGroup(menuItems)}

        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ px: 3, mb: 1 }}
        >
          Cadastros
        </Typography>
        {renderGroup(cadastrosGroup)}

        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ px: 3, mb: 1 }}
        >
          Sistema
        </Typography>
        {renderGroup(sistemaGroup)}
      </Box>

      {/* Perfil do administrador no rodapé */}
      <Paper elevation={0} sx={{ m: 1, p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
            {getInitials(user?.nome)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} color="primary.main" noWrap>
              {user?.nome || 'Admin Plural'}
            </Typography>
            <Typography variant="body2" fontSize="0.85rem" color="primary.main" noWrap>
              {user?.email || 'admin@plural.com'}
            </Typography>
          </Box>

          <IconButton onClick={handleLogout} sx={{ color: 'primary.main', ml: 1 }}>
            <SignOut size={26} />
          </IconButton>
        </Box>
      </Paper>
    </>
  )

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={variant === 'temporary' ? { keepMounted: true } : undefined}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'white',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}
