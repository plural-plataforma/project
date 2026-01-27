import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { SignOut } from "../../components/SignOut";
import Header from "../../components/Header";
const API_URL = import.meta.env.VITE_API_URL;

import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Sidebar from "../../components/Sidebar";

interface Habilidade {
  id: number;
  tipo: string;
  descricao: string;
  resumo: string;
  ativo: boolean;
  idNivelEnsino: number;
}

export default function SkillsEdit() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const signOut = SignOut();

  const [formData, setFormData] = useState<Partial<Habilidade>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (state && state.id) {
      setFormData(state);
      setLoading(false);
    } else {
      setError("Nenhum dado recebido. Volte à listagem e clique em 'Editar'.");
      setLoading(false);
    }
  }, [state]);

  const handleSave = async () => {
    if (!formData.id) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      setError("Token não encontrado. Faça login novamente.");
      setSaving(false);
      return;
    }

    const payload = {
      id: formData.id,
      idNivelEnsino: formData.idNivelEnsino,
      tipo: formData.tipo,
      descricao: formData.descricao,
      resumo: formData.resumo,
      ativo: formData.ativo,
    };

    try {
      await axios.patch(
        `${API_URL}/Habilidade/atualizar`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

    
      setSuccess(true);
      setTimeout(() => {
        navigate("/skills");
      }, 1500);
    } catch (err: any) {
      console.error("Erro ao atualizar:", err);
      setError(
        err.response?.data?.mensagem ||
        err.response?.data?.title ||
        "Erro ao salvar. Verifique os dados."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Habilidade, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    console.log(formData);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !formData.id) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/habilidades")}
          sx={{ mt: 2 }}
        >
          Voltar à Listagem
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, flex: 1 }}>
        {/* Sidebar */}
        <Sidebar activeRoute="/skills" onSignOut={signOut} />

        {/* Formulário */}
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 4 } }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} variant="outlined">
              Voltar
            </Button>
            <Typography variant="h5" fontWeight="bold">
              Editar Habilidade #{formData.id}
            </Typography>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Habilidade atualizada com sucesso! Redirecionando...
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Paper sx={{ p: 4 }}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <TextField
                  label="Descrição"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.descricao || ""}
                  onChange={(e) => handleChange("descricao", e.target.value)}
                  required
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  label="Resumo"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.resumo || ""}
                  onChange={(e) => handleChange("resumo", e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={formData.tipo || ""}
                    label="Tipo"
                    onChange={(e) => handleChange("tipo", e.target.value)}
                  >
                    <MenuItem value="1">Cognitivo</MenuItem>
                    <MenuItem value="2">Socioemocional</MenuItem>
                    <MenuItem value="3">Comunicação</MenuItem>
                    <MenuItem value="4">Motora</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Nível de Ensino</InputLabel>
                  <Select<number>
                    value={formData.idNivelEnsino ?? ""}
                    label="Nível de Ensino"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleChange("idNivelEnsino", val === 0 ? undefined : val);
                    }}
                  >
                    <MenuItem value={1}>Educação Infantil</MenuItem>
                    <MenuItem value={2}>Ensino Fundamental I - Anos Iniciais</MenuItem>
                    <MenuItem value={3}>Ensino Fundamental II - Anos Finais</MenuItem>
                    <MenuItem value={4}>Ensino Médio</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Ativo</InputLabel>
                  <Select
                    value={formData.ativo !== undefined ? String(formData.ativo) : "true"}
                    label="Ativo"
                    onChange={(e) => handleChange("ativo", e.target.value === "true")}
                  >
                    <MenuItem value="true">Sim</MenuItem>
                    <MenuItem value="false">Não</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={12}>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
                  <Button variant="outlined" size="large" onClick={() => navigate(-1)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ backgroundColor: "#276678" }}
                  >
                    {saving ? <CircularProgress size={20} color="inherit" /> : "Salvar"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}