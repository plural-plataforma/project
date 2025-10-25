import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
} from "@mui/material";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
  e.preventDefault();
  setError("");

  try {
    const response = await axios.post(
      `${API_URL}/Autenticacao/login`,
      { email, senha: password },
      { headers: { Accept: "application/json", "Content-Type": "application/json" } }
    );

    const token = response.data.token;

    if (!token) {
      setError("Não foi possível obter o token. Tente novamente.");
      return;
    }

    // Salva token de acordo com "remember me"
    if (rememberMe) {
      localStorage.setItem("token", token);
    } else {
      sessionStorage.setItem("token", token);
    }

    // Redireciona para dashboard
    navigate("/dashboard");
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      setError(err.response?.data || "Erro ao fazer login. Verifique suas credenciais.");
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
          <TextField
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

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

          <Typography
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
        </Box>
      </Paper>
    </Box>
  );
}
