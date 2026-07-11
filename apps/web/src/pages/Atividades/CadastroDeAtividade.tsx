'use client';

import { useState, useEffect, useCallback } from 'react';
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
  InputAdornment,
  Select,
  MenuItem,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
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
  CheckCircle as CheckCircleIcon,
  AttachFile as AttachFileIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import atividadesService from '../../services/atividadesService';
import type { AtividadeCreateInput } from '../../types/atividades';
import blocosService from '../../services/blocosService';
import { habilidadesService } from '../../services/habilidadesService';
import type { Habilidade } from '../../types/habilidade';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

interface HabilidadeSelecionada {
  id: number;
  descricao: string;
}

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export default function CadastroDeAtividade() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Estados do formulário
  const [titulo, setTitulo] = useState('');
  const [enunciado, setEnunciado] = useState('');
  const [nivel, setNivel] = useState<'Facil' | 'Medio' | 'Dificil'>('Facil');
  const [etapaMinima, setEtapaMinima] = useState('1');
  const [etapaMaxima, setEtapaMaxima] = useState('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [habilidadesSelecionadas, setHabilidadesSelecionadas] = useState<HabilidadeSelecionada[]>([]);
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [formError, setFormError] = useState<string | null>(null);

  const [blocoId, setBlocoId] = useState<number | ''>('');

  const [buscaHabilidade, setBuscaHabilidade] = useState('');
  const [habilidadesFiltradas, setHabilidadesFiltradas] = useState<Habilidade[]>([]);

  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Blocos ativos (mesma queryKey usada em ListaAtividades — cache compartilhado)
  const { data: blocos = [], isLoading: blocosLoading } = useQuery({
    queryKey: ['blocos-ativos'],
    queryFn: () => blocosService.getAllBlocosAtivos(),
  });

  // Todas as habilidades (mesma queryKey usada em SkillsList — cache compartilhado)
  const { data: todasHabilidades = [], isLoading: habilidadesCarregando } = useQuery({
    queryKey: ['habilidades'],
    queryFn: () => habilidadesService.getAllHabilidades(),
  });

  // Dados da atividade em modo edição
  const {
    data: atividadeCarregada,
    isLoading: atividadeLoading,
    isError: atividadeIsError,
    error: atividadeError,
    refetch: refetchAtividade,
  } = useQuery({
    queryKey: ['atividade', id],
    queryFn: () => atividadesService.getAtividadeById(Number(id)),
    enabled: isEditMode,
  });

  // Popula o formulário quando a atividade (e as habilidades, para resolver os nomes) carregam
  useEffect(() => {
    if (!atividadeCarregada) return;

    setTitulo(atividadeCarregada.titulo || '');
    setEnunciado(atividadeCarregada.enunciado || '');
    setBlocoId(atividadeCarregada.blocoId || '');
    setNivel(atividadeCarregada.nivel as 'Facil' | 'Medio' | 'Dificil');
    setEtapaMinima(atividadeCarregada.etapaMin || '1');
    setEtapaMaxima(atividadeCarregada.etapaMax || '');
    setStatus(atividadeCarregada.ativo ? 'ativo' : 'inativo');

    if (atividadeCarregada.imagemUrl) {
      setImagemPreview(atividadeCarregada.imagemUrl);
      setImagemUrl(atividadeCarregada.imagemUrl);
    }

    if (Array.isArray(atividadeCarregada.habilidadeIds) && atividadeCarregada.habilidadeIds.length > 0) {
      const detalhes = atividadeCarregada.habilidadeIds.map((habId: number) => {
        const hab = todasHabilidades.find((h) => h.id === habId);
        return {
          id: habId,
          descricao: hab?.descricao || `Habilidade ${habId} (não encontrada)`,
        };
      });
      setHabilidadesSelecionadas(detalhes as HabilidadeSelecionada[]);
    }
  }, [atividadeCarregada, todasHabilidades]);

  // Filtro local de habilidades (debounced) — sobre a lista já carregada em cache
  const [habilidadesLoading, setHabilidadesLoading] = useState(false);
  useEffect(() => {
    if (!buscaHabilidade.trim()) {
      setHabilidadesFiltradas([]);
      setHabilidadesLoading(false);
      return;
    }

    setHabilidadesLoading(true);

    const timer = setTimeout(() => {
      const termoLower = buscaHabilidade.toLowerCase().trim();

      const filtradas = todasHabilidades.filter((hab) =>
        hab.descricao?.toLowerCase().includes(termoLower) ||
        hab.id.toString().includes(termoLower) ||
        hab.tipo?.toLowerCase().includes(termoLower)
      );

      setHabilidadesFiltradas(filtradas);
      setHabilidadesLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [buscaHabilidade, todasHabilidades]);

  const invalidateAtividades = () => {
    queryClient.invalidateQueries({ queryKey: ['atividades'] });
    queryClient.invalidateQueries({ queryKey: ['atividades-stats'] });
    queryClient.invalidateQueries({ queryKey: ['atividade', id] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload: AtividadeCreateInput & { Id?: number }) =>
      isEditMode
        ? atividadesService.updateAtividade(Number(id), payload)
        : atividadesService.createAtividade(payload),
    onSuccess: () => {
      invalidateAtividades();
      navigate('/atividades', { replace: true });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => atividadesService.deleteAtividade(Number(id)),
    onSuccess: () => {
      invalidateAtividades();
      navigate('/atividades', { replace: true });
    },
  });

  const handleSalvar = () => {
    if (!titulo.trim() || habilidadesSelecionadas.length === 0 || !blocoId) {
      setFormError('Preencha todos os campos obrigatórios');
      return;
    }

    setFormError(null);

    const payload: AtividadeCreateInput & { Id?: number } = {
      titulo: titulo.trim(),
      enunciado: enunciado.trim() || undefined,
      blocoId: Number(blocoId),
      nivel,
      etapaMin: etapaMinima,
      etapaMax: etapaMaxima || undefined,
      habilidadesIds: habilidadesSelecionadas.map((h) => h.id),
      imagemUrl: imagemUrl || undefined, // só envia arquivo se nova imagem
    };

    if (isEditMode) {
      payload.Id = Number(id);
    }

    saveMutation.mutate(payload);
  };

  const handleExcluir = () => {
    if (!isEditMode) return;
    if (window.confirm('Tem certeza que deseja excluir esta atividade?')) {
      deleteMutation.mutate();
    }
  };
  const handleVoltar = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const pageLoading = isEditMode && atividadeLoading;
  const saving = saveMutation.isPending || deleteMutation.isPending;
  const error =
    formError ||
    (saveMutation.isError ? (saveMutation.error as Error).message : null) ||
    (deleteMutation.isError ? (deleteMutation.error as Error).message : null) ||
    (blocos.length === 0 && !blocosLoading ? 'Nenhum bloco ativo encontrado. Crie um bloco primeiro.' : null);

  // Função de upload
const uploadToImage = async (file: File): Promise<string | null> => {
 if (!file) return null;

  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', IMGBB_API_KEY);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error?.message || 'Falha no upload');
    }

    const uploadedUrl = json.data.url; // https://i.ibb.co/xxxx.jpg
    return uploadedUrl;
  } catch (err: any) {
    console.error('Erro ImgBB:', err);
    setFormError(`Falha ao hospedar imagem: ${err.message}`);
    return null;
  }
};

const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files?.[0]) {
    const file = e.target.files[0];
    setImagem(file);
    setImagemPreview(URL.createObjectURL(file));
    setImagemUrl(null);
    setImageUploading(true);

    const uploadedUrl = await uploadToImage(file);
    if (uploadedUrl) {
      setImagemUrl(uploadedUrl);
    }
    setImageUploading(false);
  }
};
  const adicionarHabilidade = (habilidade: Habilidade) => {
    if (habilidadesSelecionadas.some((h) => h.id === habilidade.id)) {
      return;
    }

    setHabilidadesSelecionadas((prev) => [
      ...prev,
      {
        id: habilidade.id,
        descricao: habilidade.descricao || 'Sem descrição',
      },
    ]);

    setBuscaHabilidade('');
  };

  const removerHabilidade = (id: number) => {
    setHabilidadesSelecionadas((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f9fafb', padding: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
        
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: { xs: '100%' },
          mx: 'auto',
          width: '100%',
        }}
      >
        {/* Header */}
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
              {isEditMode ? 'Editar Atividade' : 'Cadastro de Atividade'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Última modificação: 15/01/2024
            </Typography>
            <Chip
              label="JD"
              size="small"
              sx={{
                bgcolor: '#3b82f6',
                color: 'white',
                fontWeight: 500,
                width: 32,
                height: 32,
              }}
            />
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 3, md: 4 } }}>
          {pageLoading ? (
            <LoadingState variant="inline" />
          ) : atividadeIsError ? (
            <ErrorState
              title="Não foi possível carregar a atividade"
              message={atividadeError instanceof Error ? atividadeError.message : undefined}
              onRetry={() => refetchAtividade()}
            />
          ) : (
            <>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6" fontWeight={600} color="#276678">
                    {isEditMode ? 'Editar' : 'Dados da'} Atividade
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isEditMode ? 'Atualize as informações da atividade' : 'Preencha as informações básicas da atividade educacional'}
                  </Typography>
                </Box>

                <Chip
                  label={status === 'ativo' ? 'Ativo' : 'Inativo'}
                  color={status === 'ativo' ? 'success' : 'default'}
                  size="small"
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Título + Bloco */}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <FormControl sx={{ flex: 1, minWidth: 300 }}>
                    <FormLabel required>Título</FormLabel>
                    <TextField
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ex: Resolução de Problemas com Frações"
                      fullWidth
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  </FormControl>

                  <FormControl sx={{ minWidth: 260 }}>
                    <FormLabel required>Bloco</FormLabel>
                    {blocosLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2">Carregando blocos ativos...</Typography>
                      </Box>
                    ) : blocos.length === 0 ? (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        Nenhum bloco ativo disponível
                      </Typography>
                    ) : (
                      <Select
                        value={blocoId}
                        onChange={(e) => setBlocoId(e.target.value as number)}
                        fullWidth
                        variant="outlined"
                        sx={{ mt: 1 }}
                        displayEmpty
                      >
                        <MenuItem value="" disabled>
                          Selecione um bloco ativo
                        </MenuItem>
                        {blocos.map((b) => (
                          <MenuItem key={b.id} value={b.id}>
                            {b.titulo} {b.ordem ? `(Ordem ${b.ordem})` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </FormControl>
                </Box>

                {/* Enunciado */}
                <FormControl fullWidth>
                  <FormLabel>Enunciado</FormLabel>
                  <Box
                    sx={{
                      mt: 1,
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: '#f9fafb',
                        p: 1,
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        gap: 1,
                      }}
                    >
                      <IconButton size="small"><BoldIcon fontSize="small" /></IconButton>
                      <IconButton size="small"><ItalicIcon fontSize="small" /></IconButton>
                      <IconButton size="small"><UnderlineIcon fontSize="small" /></IconButton>
                      <Divider orientation="vertical" flexItem />
                      <IconButton size="small"><BulletListIcon fontSize="small" /></IconButton>
                      <IconButton size="small"><NumberedListIcon fontSize="small" /></IconButton>
                    </Box>

                    <TextField
                      multiline
                      rows={8}
                      value={enunciado}
                      onChange={(e) => setEnunciado(e.target.value)}
                      variant="standard"
                      fullWidth
                      InputProps={{
                        disableUnderline: true,
                        sx: { p: 2, fontSize: 16 },
                      }}
                      placeholder="Digite o enunciado da atividade aqui..."
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Suporte a formatação simples e quebras de linha
                  </Typography>
                </FormControl>

                {/* Nível + Etapas */}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel required>Nível</FormLabel>
                    <RadioGroup
                      row
                      value={nivel}
                      onChange={(e) => setNivel(e.target.value as 'Facil' | 'Medio' | 'Dificil')}
                      sx={{ mt: 1, gap: 4 }}
                    >
                      <FormControlLabel value="Facil" control={<Radio />} label="Fácil" />
                      <FormControlLabel value="Medio" control={<Radio />} label="Médio" />
                      <FormControlLabel value="Dificil" control={<Radio />} label="Difícil" />
                    </RadioGroup>
                  </FormControl>

                  <FormControl sx={{ minWidth: 260 }}>
                    <FormLabel required>Etapa Mínima</FormLabel>
                    <Select
                      value={etapaMinima}
                      onChange={(e) => setEtapaMinima(e.target.value)}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      <MenuItem value="1">1 - Educação Infantil</MenuItem>
                      <MenuItem value="2">2 - Ensino Fundamental I - Anos Iniciais</MenuItem>
                      <MenuItem value="3">3 - Ensino Fundamental II - Anos Finais</MenuItem>
                      <MenuItem value="4">4 - Ensino Médio</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 260 }}>
                    <FormLabel>Etapa Máxima (opcional)</FormLabel>
                    <Select
                      value={etapaMaxima}
                      onChange={(e) => setEtapaMaxima(e.target.value)}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      <MenuItem value="">Selecionar... (opcional)</MenuItem>
                      <MenuItem value="1">1 - Educação Infantil</MenuItem>
                      <MenuItem value="2">2 - Ensino Fundamental I - Anos Iniciais</MenuItem>
                      <MenuItem value="3">3 - Ensino Fundamental II - Anos Finais</MenuItem>
                      <MenuItem value="4">4 - Ensino Médio</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Upload de Imagem */}
                <FormControl fullWidth>
                  <FormLabel>Imagem da Atividade</FormLabel>
                  <Box
                    sx={{
                      mt: 1,
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      p: 4,
                      textAlign: 'center',
                      bgcolor: '#f9fafb',
                    }}
                  >
                    {imagemPreview || imagem ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <img
                          src={imagemPreview || (imagem ? URL.createObjectURL(imagem) : '')}
                          alt="Pré-visualização"
                          style={{ maxWidth: 150, borderRadius: 8 }}
                        />
                        <Box>
                          <Typography>{imagem?.name || 'Imagem atual'}</Typography>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              setImagem(null);
                              setImagemPreview(null);
                            }}
                          >
                            Remover
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        <AttachFileIcon sx={{ fontSize: 48, color: '#2563eb' }} />
                        <Typography variant="body1" color="#2563eb" mt={1}>
                          Clique para enviar ou arraste e solte
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          PNG, JPG até 5MB
                        </Typography>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                          id="image-upload"
                        />
                        <label htmlFor="image-upload">
                          <Button variant="outlined" component="span" sx={{ mt: 2 }}>
                            Selecionar arquivo
                          </Button>
                        </label>
                      </Box>
                    )}
                  </Box>
                </FormControl>

                {/* Habilidades */}
                <FormControl fullWidth>
                  <FormLabel required>Habilidades</FormLabel>
                  <TextField
                    placeholder="Buscar por código ou descrição da habilidade..."
                    value={buscaHabilidade}
                    onChange={(e) => setBuscaHabilidade(e.target.value)}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mt: 1 }}
                  />

                  {(habilidadesLoading || habilidadesCarregando) ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">
                        {buscaHabilidade.trim() ? 'Filtrando habilidades...' : 'Carregando habilidades...'}
                      </Typography>
                    </Box>
                  ) : buscaHabilidade.trim() && habilidadesFiltradas.length > 0 ? (
                    <Paper sx={{ mt: 1, maxHeight: 200, overflowY: 'auto', border: '1px solid #d1d5db' }}>
                      <List dense>
                        {habilidadesFiltradas
                          .filter((hab) => !habilidadesSelecionadas.some((sel) => sel.id === hab.id))
                          .map((hab) => (
                            <ListItemButton
                              key={hab.id}
                              onClick={() => adicionarHabilidade(hab)}
                            >
                              <ListItemText
                                primary={
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: hab.descricao?.replace(
                                        new RegExp(
                                          buscaHabilidade.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                                          'gi'
                                        ),
                                        (match) => `<strong style="background: #ffe082">${match}</strong>`
                                      ) || 'Sem descrição',
                                    }}
                                  />
                                }
                                secondary={`ID: ${hab.id}${hab.tipo ? ` - ${hab.tipo}` : ''}`}
                              />
                            </ListItemButton>
                          ))}
                      </List>
                    </Paper>
                  ) : buscaHabilidade.trim() ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Nenhuma habilidade encontrada para "{buscaHabilidade}"
                    </Typography>
                  ) : null}

                  {/* Chips selecionados */}
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {habilidadesSelecionadas.map((hab) => (
                      <Chip
                        key={hab.id}
                        label={`${hab.id} - ${hab.descricao}`}
                        onDelete={() => removerHabilidade(hab.id)}
                        color="primary"
                        sx={{
                          bgcolor: '#276678',
                          color: 'white',
                          maxWidth: 320,
                          '& .MuiChip-label': {
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          },
                        }}
                      />
                    ))}
                  </Box>
                </FormControl>

                {/* Status */}
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <RadioGroup
                    row
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
                    sx={{ mt: 1, gap: 4 }}
                  >
                    <FormControlLabel value="ativo" control={<Radio color="success" />} label="Ativo" />
                    <FormControlLabel value="inativo" control={<Radio />} label="Inativo" />
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
                }}
              >
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleExcluir}
                  disabled={saving || !isEditMode}
                >
                  Excluir
                </Button>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleVoltar}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={(saving || imageUploading) ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSalvar}
                    disabled={saving || imageUploading || habilidadesSelecionadas.length === 0}
                    sx={{ bgcolor: '#ffbe33', '&:hover': { bgcolor: '#f5a623' } }}
                  >
                    {imageUploading ? 'Enviando imagem...' : saving ? 'Salvando...' : isEditMode ? 'Atualizar Atividade' : 'Salvar Atividade'}
                  </Button>
                </Box>
              </Box>

              {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

              {!error && titulo && enunciado && habilidadesSelecionadas.length > 0 && (
                <Alert
                  severity="success"
                  icon={<CheckCircleIcon />}
                  sx={{ mt: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}
                >
                  Todos os campos obrigatórios foram preenchidos
                </Alert>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
}