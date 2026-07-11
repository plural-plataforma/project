'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  IconButton,
  Chip,
  Alert,
  Divider,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  FormatBold as BoldIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import blocosService from '../../services/blocosService';
import type { BlocoCreateInput } from '../../types/blocos';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

export default function CadastroBloco() {
  const { id, action } = useParams<{ id?: string; action?: string }>();
  const blocoId = id ? Number(id) : undefined;
  const queryClient = useQueryClient();

  // Detecção de modo - prioriza 'editar' explicitamente
  const isEditMode = action === 'editar' && !!blocoId;
  const isViewMode = !!blocoId && action !== 'editar';

  const [titulo, setTitulo] = useState('');
  const [ordem, setOrdem] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [formError, setFormError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Carrega dados do bloco se tiver ID (view ou edit)
  const {
    data: blocoData,
    isLoading: pageLoading,
    isError: pageIsError,
    error: pageError,
  } = useQuery({
    queryKey: ['bloco', blocoId],
    queryFn: async () => {
      const bloco = await blocosService.getBlocoById(blocoId!);
      setTitulo(bloco.titulo || '');
      setOrdem(bloco.ordem?.toString() || '');
      setObservacoes(bloco.observacao || '');
      setStatus(bloco.status ? 'ativo' : 'inativo');
      return bloco;
    },
    enabled: !!blocoId,
  });

  const updatedAt = blocoData?.updatedAt ?? null;

  // Ordens já usadas por outros blocos ativos (para não duplicar)
  const { data: blocosAtivos = [] } = useQuery({
    queryKey: ['blocos-ativos'],
    queryFn: () => blocosService.getAllBlocosAtivos(),
  });

  const ordensUsadas = blocosAtivos
    .filter((b) => !blocoId || b.id !== blocoId)
    .map((b) => b.ordem)
    .filter(Boolean) as number[];

  const invalidateBlocos = () => {
    queryClient.invalidateQueries({ queryKey: ['blocos'] });
    queryClient.invalidateQueries({ queryKey: ['blocos-ativos'] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload: BlocoCreateInput) =>
      isEditMode && blocoId
        ? blocosService.updateBloco(blocoId, payload)
        : blocosService.createBloco(payload),
    onSuccess: () => {
      invalidateBlocos();
      navigate('/blocos', { replace: true });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => blocosService.deleteBloco(blocoId!),
    onSuccess: () => {
      invalidateBlocos();
      navigate('/blocos', { replace: true });
    },
  });

  const handleVoltar = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSalvar = useCallback(() => {
    if (isViewMode) return;

    if (!titulo.trim()) {
      setFormError('O título é obrigatório');
      return;
    }
    if (!ordem) {
      setFormError('A ordem é obrigatória');
      return;
    }

    setFormError(null);
    saveMutation.mutate({
      titulo: titulo.trim(),
      ordem: Number(ordem),
      observacao: observacoes.trim() || null,
      status: status === 'ativo',
      icone: null,
    });
  }, [titulo, ordem, observacoes, status, isViewMode, saveMutation]);

  const handleExcluir = useCallback(() => {
    if (!blocoId || isViewMode) return;
    if (!window.confirm('Tem certeza que deseja excluir este bloco?')) return;
    deleteMutation.mutate();
  }, [blocoId, isViewMode, deleteMutation]);

  const loading = saveMutation.isPending || deleteMutation.isPending;
  const error =
    formError ||
    (saveMutation.isError ? (saveMutation.error as Error).message : null) ||
    (deleteMutation.isError ? (deleteMutation.error as Error).message : null);

  if (pageLoading) {
    return <LoadingState variant="inline" />;
  }

  if (pageIsError && !titulo) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <ErrorState message={pageError instanceof Error ? pageError.message : 'Não foi possível carregar os dados do bloco.'} />
        <Button variant="contained" sx={{ mt: 3 }} onClick={() => navigate('/blocos')}>
          Voltar para lista
        </Button>
      </Box>
    );
  }

  const gerarOrdensDisponiveis = () => {
    let ordens = [1, 2, 3, 4, 5, 6];
    const usadas = ordensUsadas;

    // Filtra as ordens já usadas
    let disponiveis = ordens.filter((num) => !usadas.includes(num));

    // Se só sobrar 1 disponível, incrementa o array
    while (disponiveis.length <= 1) {
      const proximo = ordens[ordens.length - 1] + 1;
      ordens.push(proximo);
      disponiveis = ordens.filter((num) => !usadas.includes(num));
    }

    return ordens;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f9fafb', padding: { xs: 2, md: 4 }}}>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: { xs: '100%'},
          mx: 'auto',
          width: '100%',
        }}
      >
        {/* Cabeçalho */}
        <Box
          sx={{
            px: 4,
            py: 2,
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'white',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleVoltar} size="large">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight={600} color="primary.main">
              {isViewMode
                ? 'Visualizar Bloco de Avaliação'
                : isEditMode
                  ? 'Editar Bloco de Avaliação'
                  : 'Cadastro de Bloco de Avaliação'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Última modificação: {updatedAt ? new Date(updatedAt).toLocaleString('pt-BR') : '—'}
            </Typography>
            {/** <Chip label="JD" size="small" color="primary" /> */}
          </Box>
        </Box>

        {/* Conteúdo */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" fontWeight={600} color="primary.main">
                Dados do Bloco
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isViewMode ? 'Visualização dos dados do bloco' : isEditMode ? 'Edite as informações' : 'Preencha as informações básicas'}
              </Typography>
            </Box>

            <Chip
              label={status === 'ativo' ? 'Ativo' : 'Inativo'}
              color={status === 'ativo' ? 'success' : 'default'}
              size="small"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 4, flexGrow: 1 }}>
            {/* Título + Ordem */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <FormControl sx={{ flex: 1, minWidth: 300 }}>
                <FormLabel required>Título</FormLabel>
                <TextField
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  sx={{ mt: 1 }}
                  disabled={isViewMode}
                  InputProps={isViewMode ? { readOnly: true } : undefined}
                />
              </FormControl>

              <FormControl sx={{ width: 200 }}>
                <FormLabel required>Ordem</FormLabel>
                <TextField
                  select
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  sx={{ mt: 1 }}
                  disabled={isViewMode}
                >
                  {gerarOrdensDisponiveis().map((num) => (
                    <MenuItem
                      key={num}
                      value={num.toString()}
                      disabled={ordensUsadas.includes(num)} // bloqueia as usadas
                    >
                      {num} {ordensUsadas.includes(num) ? '(já usado)' : ''}
                    </MenuItem>
                  ))}
                </TextField>

              </FormControl>


            </Box>

            {/* Observações */}
            <FormControl fullWidth sx={{ flex: 1 }}>
              <FormLabel>Observações</FormLabel>
              <Box
                sx={{
                  mt: 1,
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  bgcolor: isViewMode ? 'action.hover' : 'white',
                }}
              >
                <Box
                  sx={{
                    bgcolor: '#f9fafb',
                    p: 1,
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: 1,
                    flexShrink: 0,
                  }}
                >
                  <IconButton size="small" disabled={isViewMode}><BoldIcon fontSize="small" /></IconButton>
                  {/* ... outros botões da toolbar */}
                </Box>

                <TextField
                  multiline
                  rows={8}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  variant="standard"
                  fullWidth
                  disabled={isViewMode}
                  InputProps={{
                    disableUnderline: true,
                    readOnly: isViewMode,
                    sx: { p: 2, fontSize: 16, flex: 1, bgcolor: isViewMode ? 'transparent' : 'white' },
                  }}
                  placeholder="Digite as observações aqui..."
                  sx={{ flex: 1 }}
                />
              </Box>
            </FormControl>

            {/* Status */}
            <FormControl disabled={isViewMode}>
              <FormLabel>Status</FormLabel>
              <RadioGroup
                row
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
                sx={{ mt: 1, gap: 4 }}
              >
                <FormControlLabel value="ativo" control={<Radio color="success" />} label="Ativo" disabled={isViewMode} />
                <FormControlLabel value="inativo" control={<Radio />} label="Inativo" disabled={isViewMode} />
              </RadioGroup>
            </FormControl>
          </Box>

          {/* Ações */}
          <Box
            sx={{
              mt: 'auto',
              pt: 3,
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              flexShrink: 0,
            }}
          >
            {!isViewMode && (
              <>
                {isEditMode && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleExcluir}
                    disabled={loading}
                  >
                    Excluir
                  </Button>
                )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleVoltar}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>

                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSalvar}
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : isEditMode ? 'Atualizar Bloco' : 'Salvar Bloco'}
                  </Button>
                </Box>
              </>
            )}

            {isViewMode && (
              <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleVoltar}>
                  Voltar
                </Button>
              </Box>
            )}
          </Box>

          {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
        </Box>
      </Paper>
    </Box>
  );
}