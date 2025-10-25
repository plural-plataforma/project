// pages/User/Register.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
const API_URL = import.meta.env.VITE_API_URL;

import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

export default function Register() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState(""); // Estado adicionado
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validações
    if (!email || !senha || !nomeCompleto || !confirmSenha) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Por favor, insira um e-mail válido.");
      return;
    }

    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmSenha) {
      setError("A senha e a confirmação não coincidem.");
      return;
    }

    if (!aceitouTermos) {
      setError("Você deve aceitar os termos de uso.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/Autenticacao/registro`,
        {
          email,
          senha, // Envia apenas senha
          nomeCompleto,
          aceitouTermos,
          deveAlterarSenha: true, // Sempre true
        },
        {
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess("Registro realizado com sucesso! Você será redirecionado para o login.");
      setEmail("");
      setSenha("");
      setConfirmSenha("");
      setNomeCompleto("");
      setAceitouTermos(false);

      // Redireciona para o login após 2 segundos
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Erro ao registrar:", err);
      setError("Erro ao realizar o registro. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Box
        component="main"
        sx={{
          flex: 1,
          p: { xs: 2, sm: 4 },
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <Paper
          sx={{
            p: 4,
            maxWidth: 500,
            width: "100%",
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <Typography variant="h5" fontWeight="bold" mb={1}>
            Registrar
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Crie sua conta preenchendo os campos abaixo.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="E-mail"
                type="email"
                fullWidth
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Senha"
                type="password"
                fullWidth
                size="small"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Confirmar Senha"
                type="password"
                fullWidth
                size="small"
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Nome Completo"
                type="text"
                fullWidth
                size="small"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                disabled={loading}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={aceitouTermos}
                    onChange={(e) => setAceitouTermos(e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Aceito os termos de uso"
              />
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    color: "#FFF",
                    backgroundColor: "#276678",
                    textTransform: "none",
                  }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Salvar"}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleBack}
                  sx={{ textTransform: "none" }}
                  disabled={loading}
                >
                  Voltar
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}