'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Pagination,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import atividadesService from '../../services/atividadesService';
import { Atividade, AtividadeResponse } from '../../types/atividades'; // ajuste o import conforme seu tipo

interface ListaAtividadesProps {
  search: string;
  statusFilter: 'todos' | 'ativo' | 'inativo';
}

const ROWS_PER_PAGE = 10;

export default function ListaAtividades({ search, statusFilter }: ListaAtividadesProps) {
  const navigate = useNavigate();

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAtividades = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        busca: search.trim() || undefined,
        ativo: statusFilter === 'todos' ? undefined : statusFilter === 'ativo',
        page,
        pageSize: ROWS_PER_PAGE,
      };

      const lista: Atividade[] = await atividadesService.getAtividades(params);
      setAtividades(lista);
      setTotalPages(Math.ceil(lista.length / ROWS_PER_PAGE) || 1);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar as atividades.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtividades();
  }, [page, search, statusFilter]);

  const handleNovaAtividade = () => {
    navigate('/atividades/novo');
  };

  const handleExportar = () => {
    console.log('Exportar lista (implemente CSV/Excel real)');
  };

  const handleVisualizar = (id: number) => {
    navigate(`/atividades/${id}`);
  };

  const handleEditar = (id: number) => {
    navigate(`/atividades/${id}/editar`);
  };

  const handleExcluir = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setLoading(true);
      await atividadesService.deleteAtividade(id);
      alert('Atividade excluída com sucesso!');
      fetchAtividades(); // recarrega a lista
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir a atividade. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(39,102,120,0.42)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Cabeçalho + botões */}
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600} color="#276678">
            Lista de Atividades
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie todo o banco de atividades do sistema
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportar}
            sx={{
              borderColor: 'rgba(39,102,120,0.42)',
              color: '#276678',
              borderRadius: '8px',
            }}
          >
            Exportar
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNovaAtividade}
            sx={{
              bgcolor: '#276678',
              '&:hover': { bgcolor: '#1e4d5a' },
              borderRadius: '8px',
            }}
          >
            Nova Atividade
          </Button>
        </Box>
      </Box>

      {/* Loading e erro */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ m: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f9fafb' }}>
                <TableRow>
                  <TableCell sx={{ pl: 4, fontWeight: 600, color: '#276678' }}>
                    Nome da Atividade
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#276678' }}>Bloco</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#276678' }}>Nível</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#276678' }}>Status</TableCell>
                  <TableCell align="right" sx={{ pr: 4, fontWeight: 600, color: '#276678' }}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {atividades.map((atividade) => (
                  <TableRow
                    key={atividade.id}
                    hover
                    sx={{ height: 73, '&:last-child td': { border: 0 } }}
                  >
                    <TableCell sx={{ pl: 4 }}>
                      <Box>
                        <Typography fontWeight={600} color="#276678">
                          {atividade.titulo || 'Sem título'}
                        </Typography>
                        {/* Se tiver data de criação no model */}
                        {/* <Typography variant="caption" color="text.secondary">
                          Criado em {new Date(atividade.criadoEm).toLocaleDateString('pt-BR')}
                        </Typography> */}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={atividade.titulo || 'Sem bloco'}
                        size="small"
                        sx={{ bgcolor: '#f3f4f6', fontWeight: 500 }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={atividade.nivel}
                        size="small"
                        color={
                          atividade.nivel === 'Facil' ? 'success' :
                            atividade.nivel === 'Medio' ? 'warning' : 'error'
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={atividade.ativo ? 'Ativo' : 'Inativo'}
                        size="small"
                        sx={{
                          bgcolor: atividade.ativo ? '#dcfce7' : '#fee2e2',
                          color: atividade.ativo ? '#15803d' : '#b91c1c',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>

                    <TableCell align="right" sx={{ pr: 4 }}>
                      <Tooltip title="Visualizar">
                        <IconButton size="small" onClick={() => handleVisualizar(atividade.id)}>
                          <VisibilityIcon fontSize="small" sx={{ color: '#276678' }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEditar(atividade.id)}>
                          <EditIcon fontSize="small" sx={{ color: '#276678' }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Excluir">
                        <IconButton size="small" onClick={() => handleExcluir(atividade.id)}>
                          <DeleteIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}

                {atividades.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                      <Typography variant="body1" color="text.secondary">
                        Nenhuma atividade encontrada
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginação */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Mostrando <strong>{atividades.length}</strong> de <strong>{atividades.length}</strong> atividades
              {/* Ajuste com total real quando o backend retornar */}
            </Typography>

            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': { borderRadius: '8px' },
                '& .Mui-selected': { bgcolor: '#276678 !important', color: 'white' },
              }}
            />
          </Box>
        </>
      )}
    </Paper>
  );
}