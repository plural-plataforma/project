import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import habilidadesService from '../../services/habilidadesService';

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
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

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
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<Habilidade>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // Prioridade 1: dados enviados via state (mais rápido, sem requisição).
  // Prioridade 2: busca pelo ID (fallback, ex.: acesso direto pela URL).
  const hasStateData = state && state.id != null;

  const {
    data: fetchedHabilidade,
    isLoading,
    isError,
    error: fetchError,
  } = useQuery({
    queryKey: ['habilidade', id],
    queryFn: () => habilidadesService.getHabilidadeById(Number(id)),
    enabled: !hasStateData && !!id,
  });

  useEffect(() => {
    if (hasStateData) {
      setFormData({
        id: Number(state.id),
        tipo: Number(state.tipo),
        descricao: state.descricao || '',
        resumo: state.resumo || '',
        ativo: !!state.ativo,
        idNivelEnsino: Number(state.idNivelEnsino),
      });
    } else if (fetchedHabilidade) {
      setFormData({
        id: Number(fetchedHabilidade.id),
        tipo: Number(fetchedHabilidade.tipo),
        descricao: fetchedHabilidade.descricao || '',
        resumo: fetchedHabilidade.resumo || '',
        ativo: !!fetchedHabilidade.ativo,
        idNivelEnsino: Number(fetchedHabilidade.idNivelEnsino),
      });
    }
  }, [hasStateData, state, fetchedHabilidade]);

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Habilidade) => habilidadesService.updateHabilidade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habilidades'] });
      queryClient.invalidateQueries({ queryKey: ['habilidade', id] });
      setTimeout(() => {
        navigate('/skills');
      }, 1500);
    },
  });

  const handleSave = () => {
    if (!formData.id) {
      setValidationError('ID da habilidade não encontrado.');
      return;
    }
    if (!formData.descricao?.trim()) {
      setValidationError('A descrição é obrigatória.');
      return;
    }

    setValidationError(null);
    updateMutation.mutate({
      id: formData.id,
      idNivelEnsino: Number(formData.idNivelEnsino),
      tipo: Number(formData.tipo),
      descricao: formData.descricao.trim(),
      resumo: (formData.resumo || '').trim(),
      ativo: !!formData.ativo,
    });
  };

  const handleChange = (field: keyof Habilidade, value: string | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const loadError = isError ? (fetchError instanceof Error ? fetchError.message : 'Não foi possível carregar os dados da habilidade.') : null;
  const saveError = validationError || (updateMutation.isError ? (updateMutation.error as Error).message : null);
  const error = loadError || saveError;
  const saving = updateMutation.isPending;
  const success = updateMutation.isSuccess;
  const loading = !hasStateData && isLoading;

  if (loading) {
    return <LoadingState variant="inline" />;
  }

  if (loadError && !formData.id) {
    return (
      <Box sx={{ p: 4 }}>
        <ErrorState message={loadError} />
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
            <Typography variant="h5" fontWeight="bold" color="primary.main">
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
