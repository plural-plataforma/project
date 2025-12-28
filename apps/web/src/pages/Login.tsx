import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
const API_URL = import.meta.env.VITE_API_URL;

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
  IconButton,
} from "@mui/material";
import React from "react";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  }
  interface LoginResponse {
    token: {
      token: string;
      precisaTrocarSenha: boolean;
    };
  }

  useEffect(() => {
    // Simula verificação (pode adicionar validação real do token aqui depois)
    setIsLoading(false);
  }, []);

  if (isLoading) return <div>Carregando...</div>;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      console.log("API:", API_URL);
      const response = await axios.post<LoginResponse>(
        `${API_URL}/Autenticacao/login`,
        { email, senha: password },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const token = response.data.token.token;

      if (!token) {
        setError("Não foi possível obter o token. Tente novamente.");
        return;
      }

      const tokenString = String(token);

      if (rememberMe) {
        localStorage.setItem("token", tokenString);
        sessionStorage.removeItem("token"); // limpa o outro
      } else {
        sessionStorage.setItem("token", tokenString);
        localStorage.removeItem("token"); // limpa o outro
      }

      navigate("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as string) ||
          "Erro ao fazer login. Verifique suas credenciais."
        );
        console.error(err.response?.data || err.message);
      } else {
        setError("Erro ao fazer login. Verifique suas credenciais.");
        console.error(err);
      }
    }
  };


  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        bgcolor: "grey.100",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 3,
          width: 380,
        }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <img
            src="/logo-plural-plataforma.png"
            alt="Plural Logo"
            style={{ height: 80, width: "auto", marginLeft: "auto", marginRight: "auto" }}
          />
          <Typography variant="h5" fontWeight="bold" mt={2}>
          </Typography>
        </Box>

        {/* Formulário */}
        <Box component="form" onSubmit={handleLogin}>
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel htmlFor="outlined-adornment-password">Senha</InputLabel>
            <OutlinedInput
              id="outlined-adornment-password"
              type={showPassword ? 'text' : 'password'}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      showPassword ? 'hide the password' : 'display the password'
                    }
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    onMouseUp={handleMouseUpPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
              />
            }
            label="Lembrar-me"
            sx={{ mt: 1 }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            style={{ color: "#FFFF", backgroundColor: "#276678" }}
            fullWidth
            sx={{ mt: 3 }}
          >
            Entrar
          </Button>

          {/**   <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mt: 3 }}
          >
            Não tem uma conta?{" "}
            <Typography
              component="a"
              href="/register"
              color="primary"
              fontWeight="medium"
              sx={{ textDecoration: "none" }}
            >
              Cadastre-se
            </Typography>
          </Typography>
           */}
        </Box>
      </Paper>
    </Box>
  );
}
