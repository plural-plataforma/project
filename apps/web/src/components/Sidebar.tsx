// src/components/Sidebar.tsx
import { useLocation, useNavigate } from 'react-router-dom';
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
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  LibraryBooks as LibraryBooksIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

// Largura fixa do sidebar (padrão comum)
const drawerWidth = 277;

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Usuários', icon: <PeopleIcon />, path: '/usuarios' },
  ];

  const cadastrosGroup = [
    { text: 'Habilidades', icon: <SchoolIcon />, path: '/skills' },
    { text: 'Blocos de Avaliação', icon: <AssessmentIcon />, path: '/blocos' },
    { text: 'Banco de Atividades', icon: <LibraryBooksIcon />, path: '/atividades' },
  ];

  const sistemaGroup = [
    { text: 'Configurações', icon: <SettingsIcon />, path: '/configuracoes' },
    { text: 'Logs de Sistema', icon: <HistoryIcon />, path: '/logs' },
  ];

  const isActive = (path: string) => location.pathname === path;

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
          borderColor: 'grey.200',
        },
      }}
    >
      {/* Logo / Título da plataforma */}
      <Box
        sx={{
          height: 80,
          display: 'flex',
          alignItems: 'center',
          px: 3,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          color="#276678"
          sx={{ letterSpacing: '-0.5px' }}
        >
          Plural
        </Typography>
      </Box>

      <Box sx={{ overflowY: 'auto', flexGrow: 1, px: 1, py: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: alpha('#276678', 0.12),
                    color: '#276678',
                    '&:hover': { bgcolor: alpha('#276678', 0.18) },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? '#276678' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        {/* Grupo Cadastros */}
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ px: 3, mb: 1, fontWeight: 600 }}
        >
          Cadastros
        </Typography>

        <List>
          {cadastrosGroup.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: alpha('#276678', 0.12),
                    color: '#276678',
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        {/* Grupo Sistema */}
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ px: 3, mb: 1, fontWeight: 600 }}
        >
          Sistema
        </Typography>

        <List>
          {sistemaGroup.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: alpha('#276678', 0.12),
                    color: '#276678',
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
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
          borderColor: 'grey.200',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: '#276678' }}>
            AP
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Admin Plural
            </Typography>
            <Typography variant="body2" color="text.secondary" fontSize="0.85rem">
              admin@plural.com
            </Typography>
          </Box>

          <IconButton size="small">
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Drawer>
  );
}