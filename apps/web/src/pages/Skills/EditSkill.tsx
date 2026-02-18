import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

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
  Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Habilidade {
  id: number;
  tipo: number;
  descricao: string;
  resumo: string;
  ativo: boolean;
  idNivelEnsino: number;
}

export default function SkillsEdit() {
  const { id } = useParams<{ id: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<Habilidade>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadHabilidade = async () => {
      // Prioridade 1: Usa dados enviados via state (mais rápido, sem requisição)
      if (state && state.id != null) {
        setFormData({
          id: Number(state.id),
          tipo: Number(state.tipo),
          descricao: state.descricao || '',
          resumo: state.resumo || '',
          ativo: !!state.ativo,
          idNivelEnsino: Number(state.idNivelEnsino)
        });
        setLoading(false);
        return;
      }

      // Prioridade 2: Busca pelo ID (fallback)
      if (!id) {
        setError("ID da habilidade não encontrado na URL.");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Token não encontrado. Faça login novamente.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/Habilidade/buscar/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const habilidade = response.data?.objeto || response.data;

        if (!habilidade?.id) {
          throw new Error("Habilidade não encontrada");
        }

        setFormData({
          id: Number(habilidade.id),
          tipo: Number(habilidade.tipo),
          descricao: habilidade.descricao || '',
          resumo: habilidade.resumo || '',
          ativo: !!habilidade.ativo,
          idNivelEnsino: Number(habilidade.idNivelEnsino)
        });
      } catch (err: any) {
        console.error('Erro ao carregar habilidade:', err);
        setError(
          err.response?.data?.mensagem ||
          err.response?.data?.title ||
          'Não foi possível carregar os dados da habilidade. Tente novamente.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadHabilidade();
  }, [id, state]);

  const handleSave = async () => {
    if (!formData.id) {
      setError('ID da habilidade não encontrado.');
      return;
    }

    if (!formData.descricao?.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setError('Token não encontrado. Faça login novamente.');
      setSaving(false);
      return;
    }

    const payload = {
      id: formData.id,
      idNivelEnsino: String(formData.idNivelEnsino),
      tipo: String(formData.tipo),
      descricao: formData.descricao.trim(),
      resumo: (formData.resumo || '').trim(),
      ativo: !!formData.ativo
    };

    try {
      await axios.patch(`${API_URL}/Habilidade/atualizar`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/skills');
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao atualizar habilidade:', err);
      const mensagemErro =
        err.response?.data?.mensagem ||
        err.response?.data?.title ||
        (err.response?.data?.errors ) ||
        'Erro ao salvar. Verifique os dados e tente novamente.';
      setError(mensagemErro);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Habilidade, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
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
          onClick={() => navigate('/skills')}
          sx={{ mt: 2 }}
        >
          Voltar à Listagem
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          flex: 1
        }}
      >
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              variant="outlined"
            >
              Voltar
            </Button>
            <Typography variant="h5" fontWeight="bold" color="#276678">
              Editar Habilidade {formData.id ? `#${formData.id}` : ''}
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

          <Paper sx={{ p: 4, borderRadius: '12px' }}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <TextField
                  label="Descrição"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.descricao || ''}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  required
                  error={!formData.descricao?.trim() && !!error}
                  helperText={!formData.descricao?.trim() && !!error ? 'Campo obrigatório' : ''}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  label="Resumo"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.resumo || ''}
                  onChange={(e) => handleChange('resumo', e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={formData.tipo ?? ''}
                    label="Tipo"
                    onChange={(e) => {
                      const val = e.target.value;
                      handleChange('tipo', val ? Number(val) : undefined);
                    }}
                  >
                    <MenuItem value="">
                      <em>Selecione o tipo</em>
                    </MenuItem>
                    <MenuItem value={1}>Cognitivo</MenuItem>
                    <MenuItem value={2}>Socioemocional</MenuItem>
                    <MenuItem value={3}>Comunicação</MenuItem>
                    <MenuItem value={4}>Motora</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Nível de Ensino</InputLabel>
                  <Select
                    value={formData.idNivelEnsino ?? ''}
                    label="Nível de Ensino"
                    onChange={(e) => {
                      const val = e.target.value;
                      handleChange('idNivelEnsino', val ? Number(val) : undefined);
                    }}
                  >
                    <MenuItem value="">
                      <em>Selecione o nível</em>
                    </MenuItem>
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
                    value={formData.ativo !== undefined ? String(formData.ativo) : 'true'}
                    label="Ativo"
                    onChange={(e) => handleChange('ativo', e.target.value === 'true')}
                  >
                    <MenuItem value="true">Sim</MenuItem>
                    <MenuItem value="false">Não</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={12}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'flex-end',
                    mt: 4
                  }}
                >
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate(-1)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      bgcolor: '#276678',
                      '&:hover': { bgcolor: '#1e4d5c' }
                    }}
                  >
                    {saving ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Salvar Alterações'
                    )}
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