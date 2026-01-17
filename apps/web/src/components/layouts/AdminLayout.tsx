// components/layouts/AdminLayout.tsx
import { Box, AppBar, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import HeaderContent from '../HeaderContent';

const drawerWidth = 277; // ← use exatamente o mesmo valor do Drawer

export default function AdminLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Área principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // deslocamento exato = largura do drawer
          ml: { xs: 0, md: `${drawerWidth}px` },
          // opcional: garante que não vaze
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        {/* Header fixo */}
        <AppBar
          position="fixed"
          elevation={1}
          sx={{
            width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
            ml: { xs: 0, md: `${drawerWidth}px` },
            bgcolor: 'white',
            borderBottom: '1px solid',
            borderColor: 'grey.200',
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar
            sx={{
              minHeight: 88,
              px: { xs: 2, lg: 4 },
            }}
          >
            <HeaderContent />
          </Toolbar>
        </AppBar>

        {/* Conteúdo da página */}
        <Box
          sx={{
            mt: '88px',  // altura do header (ajuste se necessário)
            p: { xs: 2, lg: 3 },  // padding pequeno e uniforme
            bgcolor: 'grey.50',
            minHeight: 'calc(100vh - 88px)',
            // Força remoção total de espaçamento à esquerda
            marginLeft: 0,
            paddingLeft: 0,
            // Impede que filhos herdem ou adicionem margem esquerda
            '& > *': {
              marginLeft: 0,
              paddingLeft: 0,
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}