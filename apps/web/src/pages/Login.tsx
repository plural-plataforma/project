import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
  Alert,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton
} from '@mui/material';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import authService from '../api/authService';
import { jwtDecode } from 'jwt-decode'; // Use esta sintaxe (versão recente do pacote)

interface DecodedToken {
  role?: string;
  roles?: string[];
  [key: string]: any;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
  e.preventDefault();
  setError('');

  try {
    const response = await authService.login({
      email,
      password,
      rememberMe
    });

    const token = response.token.token;

    // Decodifica o token
    const decoded: any = jwtDecode(token);

    // Chave EXATA usada no seu backend (ASP.NET Identity)
    const roleClaimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const role = decoded[roleClaimKey];  // deve retornar "Admin" ou "Professor"

    // Verifica se é admin (case-insensitive)
    const isAdmin = role && role.toString().toLowerCase() === 'admin';

    console.log('Role detectada:', role);         // ← para debug
    console.log('É Admin?', isAdmin);             // ← para debug

    if (isAdmin) {
      navigate('/dashboard');
    } else {
      navigate('/acesso-restrito');
    }
  } catch (err: any) {
    console.error('Erro completo no login:', err);
    const mensagem =
      err?.response?.data?.mensagem ||
      err?.response?.data?.message ||
      err?.message ||
      'Erro ao fazer login. Verifique suas credenciais.';
    setError(mensagem);
  }
};

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
        p: 2
      }}
    >
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, width: { xs: '100%', sm: 400 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <img
            src="/logo-plural-plataforma.png"
            height={80}
            alt="Logo Plural Plataforma"
            style={{ maxWidth: '100%' }}
          />
          <Typography variant="h5" sx={{ mt: 2, fontWeight: 600, color: '#276678' }}>
            Entrar no Painel
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleLogin}>
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value.trim())}
            fullWidth
            margin="normal"
            required
            autoFocus
            autoComplete="email"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="password">Senha</InputLabel>
            <OutlinedInput
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(prev => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Senha"
              required
              autoComplete="current-password"
            />
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                color="primary"
              />
            }
            label="Lembrar-me neste dispositivo"
            sx={{ mt: 1 }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{
              mt: 4,
              py: 1.5,
              bgcolor: '#276678',
              '&:hover': { bgcolor: '#1e4d5c' },
              fontWeight: 600
            }}
          >
            Entrar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}