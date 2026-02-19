'use client';

import { useState, useCallback, useEffect } from 'react';
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
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberedListIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import blocosService from '../../services/blocosService';
import { BlocoCreateInput, Bloco } from '../../types/blocos';

const NUMERO_INICIAL_ORDENS = 6;

export default function CadastroBloco() {
  const { id, action } = useParams<{ id?: string; action?: string }>();
  const blocoId = id ? Number(id) : undefined;

  // Detecção de modo - prioriza 'editar' explicitamente
  const isEditMode = action === 'editar' && !!blocoId;
  const isViewMode = !!blocoId && action !== 'editar';
  const isCreateMode = !blocoId;

  // Log temporário para debug (remova depois de testar)
  useEffect(() => {
  }, [id, action]);

  const [titulo, setTitulo] = useState('');
  const [ordem, setOrdem] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(!!blocoId);
  const [ordensUsadas, setOrdensUsadas] = useState<number[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const navigate = useNavigate();

  // Carrega dados se tiver ID (view ou edit)
  useEffect(() => {
    if (!blocoId) {
      setPageLoading(false);
      return;
    }

    const fetchBloco = async () => {
      setPageLoading(true);
      setError(null);

      try {
        const bloco: Bloco = await blocosService.getBlocoById(blocoId);

        setTitulo(bloco.titulo || '');
        setOrdem(bloco.ordem?.toString() || '');
        setObservacoes(bloco.observacao || '');
        setStatus(bloco.status ? 'ativo' : 'inativo');
        setUpdatedAt(bloco.updatedAt);
      } catch (err: any) {
        console.error('Erro ao carregar bloco:', err);
        setError(err.message || 'Não foi possível carregar os dados do bloco.');
      } finally {
        setPageLoading(false);
      }
    };

    fetchBloco();

  }, [blocoId]);

  useEffect(() => {
    const fetchOrdens = async () => {
      try {
        const blocos: Bloco[] = await blocosService.getAllBlocosAtivos();
        // Pega todas as ordens, exceto a do bloco atual (se estiver editando)
        const ordens = blocos
          .filter(b => !blocoId || b.id !== blocoId)
          .map(b => b.ordem)
          .filter(Boolean) as number[];
        setOrdensUsadas(ordens);
        console.log(ordens)
      } catch (err) {
        console.error('Erro ao carregar ordens existentes:', err);
      }
    };

    fetchOrdens();
  }, [])

  const handleVoltar = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSalvar = useCallback(async () => {
    if (isViewMode) return;

    if (!titulo.trim()) {
      setError('O título é obrigatório');
      return;
    }
    if (!ordem) {
      setError('A ordem é obrigatória');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload: BlocoCreateInput = {
        titulo: titulo.trim(),
        ordem: Number(ordem),
        observacao: observacoes.trim() || null,
        status: status === 'ativo',
        icone: null, // ajuste se tiver ícone/upload
      };

      if (isEditMode && blocoId) {
        // Atualiza o bloco existente
        const blocoAtualizado = await blocosService.updateBloco(blocoId, payload);
        // Opcional: toast.success('Bloco atualizado!');
      } else if (isCreateMode) {
        const novoBloco = await blocosService.createBloco(payload);
        // Opcional: toast.success('Bloco criado!');
      }

      navigate('/blocos', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar o bloco.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [titulo, ordem, observacoes, status, isCreateMode, isEditMode, blocoId, navigate, isViewMode]);
  const handleExcluir = useCallback(async () => {
    if (!blocoId || isViewMode) return;

    if (!window.confirm('Tem certeza que deseja excluir este bloco?')) return;

    setLoading(true);
    setError(null);

    try {
      await blocosService.deleteBloco(blocoId);
      navigate('/blocos', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Não foi possível excluir o bloco.');
    } finally {
      setLoading(false);
    }
  }, [blocoId, navigate, isViewMode]);

  if (pageLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !titulo) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
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
            <Typography variant="h5" fontWeight={600} color="#276678">
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
              <Typography variant="h6" fontWeight={600} color="#276678">
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
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSalvar}
                    disabled={loading}
                    sx={{ bgcolor: '#ffbe33', '&:hover': { bgcolor: '#f5a623' } }}
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