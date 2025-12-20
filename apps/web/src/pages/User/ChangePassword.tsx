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
} from "@mui/material";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("A nova senha e a confirmação não coincidem.");
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        setError("Nenhum token de autenticação encontrado. Faça login novamente.");
        setLoading(false);
        return;
      }

      await axios.post(
      `${API_URL}/Autenticacao/alterarsenha`,
        {
          oldPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "*/*",
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess("Senha alterada com sucesso!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Erro ao trocar senha:", err);
      setError("Erro ao trocar a senha. Verifique a senha antiga ou tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/dashboard");
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
            Trocar Senha
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Insira sua senha atual e a nova senha para atualizar.
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
                label="Senha Antiga"
                type="password"
                fullWidth
                size="small"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Nova Senha"
                type="password"
                fullWidth
                size="small"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Confirmar Nova Senha"
                type="password"
                fullWidth
                size="small"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
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