'use client';

import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

interface ListaBlocosProps {
  search: string;
  statusFilter: 'todos' | 'ativos' | 'inativos';
}

const ROWS_PER_PAGE = 10;

export function blocosQueryKey(search: string, statusFilter: string) {
  return ['blocos', { search, statusFilter }] as const;
}

export default function ListaBlocos({ search, statusFilter }: ListaBlocosProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedBlocoId, setSelectedBlocoId] = useState<number | null>(null);

  const ativo = statusFilter === 'todos' ? undefined : statusFilter === 'ativos' ? true : false;

  const {
    data: blocos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: blocosQueryKey(search, statusFilter),
    queryFn: () => blocosService.getBlocosCompleto({ busca: search.trim() || undefined, status: ativo }),
  });

  const errorMessage = error instanceof Error ? error.message : 'Não foi possível carregar os blocos.';

  const deleteMutation = useMutation({
    mutationFn: (id: number) => blocosService.deleteBloco(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocos'] });
      setOpenDeleteDialog(false);
      setSelectedBlocoId(null);
    },
  });

  // Paginação local (a API não pagina a lista completa filtrada)
  const paginatedBlocos = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return blocos.slice(start, start + ROWS_PER_PAGE);
  }, [blocos, page]);

  const totalPages = Math.max(1, Math.ceil(blocos.length / ROWS_PER_PAGE));

  const handleView = useCallback((id: number) => navigate(`/blocos/${id}`), [navigate]);
  const handleEdit = useCallback((id: number) => navigate(`/blocos/${id}/editar`), [navigate]);

  const handleDeleteClick = useCallback((id: number) => {
    setSelectedBlocoId(id);
    setOpenDeleteDialog(true);
  }, []);

  const handleNovoBloco = () => navigate('/blocos/novo');
  const handleExportar = () => console.log('Exportar lista de blocos');

  return (
    <Paper elevation={0} sx={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Cabeçalho */}
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" color="primary.main">
            Lista de Blocos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie todos os blocos de atividades do sistema
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExportar}>
            Exportar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleNovoBloco}>
            Novo Bloco
          </Button>
        </Box>
      </Box>

      {isLoading && <LoadingState rows={5} />}

      {isError && <ErrorState message={errorMessage} onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 4 }}>Nome do Bloco</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Ordem</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Atividades</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right" sx={{ pr: 4 }}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedBlocos.map((bloco) => (
                  <TableRow
                    key={bloco.id}
                    hover
                    sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 }, height: 73 }}
                  >
                    <TableCell sx={{ pl: 4 }}>
                      <Typography variant="body1" fontWeight={600} color="primary.main">
                        {bloco.titulo}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
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

                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {bloco.quantidadeAtividades ?? '—'} atividades
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={bloco.status ? 'Ativo' : 'Inativo'}
                        size="small"
                        color={bloco.status ? 'success' : 'default'}
                      />
                    </TableCell>

                    <TableCell align="right" sx={{ pr: 4 }}>
                      <Tooltip title="Visualizar">
                        <IconButton size="small" onClick={() => handleView(bloco.id)}>
                          <VisibilityIcon fontSize="small" color="primary" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEdit(bloco.id)}>
                          <EditIcon fontSize="small" color="primary" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Excluir">
                        <IconButton size="small" onClick={() => handleDeleteClick(bloco.id)}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {blocos.length === 0 && (
            <EmptyState
              title="Nenhum bloco encontrado"
              description="Ajuste os filtros de busca ou cadastre um novo bloco de avaliação."
            />
          )}

          {/* Paginação local */}
          {blocos.length > 0 && (
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
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
          {deleteMutation.isError && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {(deleteMutation.error as Error).message || 'Não foi possível excluir o bloco.'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleteMutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => selectedBlocoId && deleteMutation.mutate(selectedBlocoId)}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
