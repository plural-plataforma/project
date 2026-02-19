import { Box, Typography, Button, Alert, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import authService from '../api/authService';

export default function AcessoRestrito() {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          py: 8
        }}
      >
        <Alert severity="warning" sx={{ mb: 4, width: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Acesso restrito ao painel administrativo
          </Typography>
          <Typography variant="body1">
            Esta área é exclusiva para usuários com perfil de administrador.
            <br />
            Perfis de professor não têm permissão para acessar estas funcionalidades.
          </Typography>
        </Alert>

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleLogout}
          sx={{ mt: 2, minWidth: 200 }}
        >
          Voltar ao Login
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
          Plural Plataforma © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Container>
  );
}