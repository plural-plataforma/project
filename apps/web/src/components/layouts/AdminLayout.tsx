// components/layouts/AdminLayout.tsx
import { useState } from 'react';
import { Box, AppBar, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar, { drawerWidth } from '../Sidebar';
import HeaderContent from '../HeaderContent';

export default function AdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
      />

      {/* Área principal – cresce horizontal e verticalmente */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        {/* AppBar fixo no topo */}
        <AppBar
          position="fixed"
          elevation={1}
          sx={{
            width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
            ml: { xs: 0, md: `${drawerWidth}px` },
            bgcolor: 'white',
            borderBottom: '1px solid',
            borderColor: 'divider',
            zIndex: (t) => t.zIndex.drawer + 1,
          }}
        >
          <Toolbar
            disableGutters // remove padding padrão do Toolbar
            sx={{
              minHeight: 76,     // defina explicitamente a altura real do header
              px: { xs: 2, lg: 3 },
            }}
          >
            <HeaderContent onMenuClick={() => setMobileOpen((prev) => !prev)} showMenuButton={isMobile} />
          </Toolbar>
        </AppBar>

        {/* Conteúdo da página – cresce para preencher o restante */}
        <Box
          sx={{
            flexGrow: 1,                      // ← faz crescer verticalmente
            mt: '40px',                       // exatamente a altura do AppBar + Toolbar
            display: 'flex',                  // permite que filhos usem flex
            flexDirection: 'column',
            bgcolor: 'grey.50',
            overflow: 'hidden',               // evita scroll indesejado no layout
          }}
        >
          {/* Área com padding e scroll interno se necessário */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',              // scroll só aqui, se o conteúdo for longo
              p: { xs: 2, sm: 3, lg: 4 },
              // Remove qualquer margem/padding esquerda indesejada
              ml: 0,
              pl: 0,
              '& > *': {
                ml: 0,
                pl: 0,
              },
            }}
          >
            <Outlet />  {/* Aqui o CadastroBloco vai crescer */}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}