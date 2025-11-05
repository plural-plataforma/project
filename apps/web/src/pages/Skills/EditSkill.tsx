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

interface Habilidade {
  id: number;
  tipo: string;
  descricao: string;
  resumo: string;
  ativo: boolean;
  idnivelensino: number;
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

  // Recebe dados do state
  useEffect(() => {
    if (state && state.id) {
      setFormData(state);
      setLoading(false);
    } else {
      setError("Nenhum dado recebido. Volte à listagem e clique em 'Editar'.");
      setLoading(false);
    }
  }, [state]);

  // SALVAR: PUT /api/Habilidade/atualizar
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
      idNivelEnsino: formData.idnivelensino,
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
        <Box
          component="aside"
          sx={{
            width: { xs: "100%", md: 256 },
            bgcolor: "white",
            borderRight: 1,
            borderColor: "grey.300",
            boxShadow: 1,
            position: { md: "sticky" },
            top: 64,
            height: { md: "calc(100vh - 64px)" },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", p: 2, gap: 1, flexGrow: 1 }}>
            <Button variant="outlined" fullWidth>Gerenciar Usuários</Button>
            <Button variant="outlined" fullWidth>Pagamentos</Button>
            <Button variant="outlined" fullWidth>Relatórios</Button>
            <Button variant="outlined" fullWidth>Configurações</Button>
            <Button
              variant="contained"
              fullWidth
              style={{ color: "#FFFF", backgroundColor: "#276678" }}
            >
              Habilidades
            </Button>
          </Box>
          <Box sx={{ p: 2 }}>
            <Button
              style={{ color: "#FFFF", backgroundColor: "#276678" }}
              variant="outlined"
              fullWidth
              onClick={signOut}
            >
              Sair
            </Button>
          </Box>
        </Box>

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
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tipo"
                  fullWidth
                  value={formData.tipo || ""}
                  onChange={(e) => handleChange("tipo", e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
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

              <Grid item xs={12}>
                <TextField
                  label="Resumo"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.resumo || ""}
                  onChange={(e) => handleChange("resumo", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Ativo</InputLabel>
                  <Select
                    value={formData.ativo !== undefined ? formData.ativo : true}
                    onChange={(e) => handleChange("ativo", e.target.value === true)}
                  >
                    <MenuItem value={true as any}>Sim</MenuItem>
                    <MenuItem value={false as any}>Não</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Nível de Ensino (ID)"
                  fullWidth
                  type="number"
                  value={formData.idnivelensino || ""}
                  onChange={(e) =>
                    handleChange("idnivelensino", parseInt(e.target.value) || 0)
                  }
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ backgroundColor: "#276678", color: "#FFF" }}
                  >
                    {saving ? <CircularProgress size={20} color="inherit" /> : "Salvar"}
                  </Button>
                  <Button variant="outlined" size="large" onClick={() => navigate(-1)}>
                    Cancelar
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