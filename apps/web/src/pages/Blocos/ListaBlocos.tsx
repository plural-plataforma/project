'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as ExportIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import blocosService from '../../services/blocosService';
import { Bloco } from '../../types/blocos';

interface ListaBlocosProps {
  search: string;
  statusFilter: 'todos' | 'ativos' | 'inativos';
  onTotalChange?: (total: number) => void;
}

const ROWS_PER_PAGE = 10;

export default function ListaBlocos({ search, statusFilter, onTotalChange }: ListaBlocosProps) {
  const navigate = useNavigate();

  const [blocos, setBlocos] = useState<Bloco[]>([]); // lista completa
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedBlocoId, setSelectedBlocoId] = useState<number | null>(null);

  // Busca TODOS os blocos filtrados (sem paginação no backend)
  const loadBlocos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const ativo =
        statusFilter === 'todos' ? undefined :
        statusFilter === 'ativos' ? true : false;

      const data = await blocosService.getBlocosCompleto({
        busca: search.trim() || undefined,
        status: ativo,
      });

      setBlocos(data);
      onTotalChange?.(data.length);
    } catch (err: any) {
      setError('Não foi possível carregar os blocos. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, onTotalChange]);

  useEffect(() => {
    loadBlocos();
    setPage(1); // reseta página ao mudar filtro/busca
  }, [loadBlocos]);

  // Paginação local (slice)
  const paginatedBlocos = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return blocos.slice(start, start + ROWS_PER_PAGE);
  }, [blocos, page]);

  const totalPages = Math.ceil(blocos.length / ROWS_PER_PAGE);

  const handleView = useCallback((id: number) => {
    navigate(`/blocos/${id}`);
  }, [navigate]);

  const handleEdit = useCallback((id: number) => {
    navigate(`/blocos/${id}/editar`);
  }, [navigate]);

  const handleDeleteClick = useCallback((id: number) => {
    setSelectedBlocoId(id);
    setOpenDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedBlocoId) return;

    setDeleteLoading(true);

    try {
      await blocosService.deleteBloco(selectedBlocoId);
      await loadBlocos(); // atualiza lista
    } catch (err: any) {
      setError(err.message || 'Não foi possível excluir o bloco.');
    } finally {
      setDeleteLoading(false);
      setOpenDeleteDialog(false);
      setSelectedBlocoId(null);
    }
  }, [selectedBlocoId, loadBlocos]);

  const handleNovoBloco = () => {
    navigate('/blocos/novo');
  };

  const handleExportar = () => {
    console.log('Exportar lista de blocos');
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(39, 102, 120, 0.42)',
        borderRadius: '12px',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cabeçalho */}
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
            Lista de Blocos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie todos os blocos de atividades do sistema
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportar}
            sx={{
              borderColor: 'rgba(39, 102, 120, 0.42)',
              color: '#276678',
            }}
          >
            Exportar
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNovoBloco}
            sx={{ bgcolor: '#276678' }}
          >
            Novo Bloco
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
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ pl: 4, fontWeight: 600, color: '#276678' }}>
                    Nome do Bloco
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#276678' }}>
                    Ordem
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#276678' }}>
                    Atividades
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#276678' }}>
                    Status
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 4, fontWeight: 600, color: '#276678' }}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedBlocos.map((bloco) => (
                  <TableRow
                    key={bloco.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:last-child td, &:last-child th': { border: 0 },
                      height: 73,
                    }}
                  >
                    <TableCell sx={{ pl: 4 }}>
                      <Typography variant="body1" fontWeight={600} color="#276678">
                        {bloco.titulo}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box
                        sx={{
                          bgcolor: '#f3f4f6',
                          borderRadius: '8px',
                          width: 42,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                        }}
                      >
                        {bloco.ordem}
                      </Box>
                    </TableCell>

                  

                    <TableCell>
                      <Chip
                        label={bloco.status ? 'Ativo' : 'Inativo'}
                        size="small"
                        sx={{
                          bgcolor: bloco.status ? '#dcfce7' : '#fee2e2',
                          color: bloco.status ? '#15803d' : '#b91c1c',
                        }}
                      />
                    </TableCell>

                    <TableCell align="right" sx={{ pr: 4 }}>
                      <Tooltip title="Visualizar">
                        <IconButton size="small" onClick={() => handleView(bloco.id)}>
                          <VisibilityIcon fontSize="small" sx={{ color: '#276678' }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEdit(bloco.id)}>
                          <EditIcon fontSize="small" sx={{ color: '#276678' }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Excluir">
                        <IconButton size="small" onClick={() => handleDeleteClick(bloco.id)}>
                          <DeleteIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}

                {paginatedBlocos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                      <Typography color="text.secondary">Nenhum bloco encontrado</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginação local */}
          {blocos.length > 0 && (
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
                Mostrando <strong>{paginatedBlocos.length}</strong> de <strong>{blocos.length}</strong> blocos
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
          )}
        </>
      )}

      {/* Dialog de exclusão */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este bloco? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleteLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}