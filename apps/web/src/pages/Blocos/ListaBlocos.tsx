'use client';

import { useState, useCallback, useEffect } from 'react';
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
  Avatar,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as ExportIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Visibility as VisibilityIcon,     // olho - visualizar
  Edit as EditIcon,                 // lápis - editar
  Delete as DeleteIcon,             // lixeira - excluir
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Bloco } from '../../types/blocos';
import blocosService from '../../services/blocosService';

interface ListaBlocosProps {
  search: string;
  statusFilter: 'todos' | 'ativos' | 'inativos';
  onTotalChange?: (total: number) => void;
}

const ROWS_PER_PAGE = 10;

export default function ListaBlocos({ search, statusFilter, onTotalChange }: ListaBlocosProps) {
  const [page, setPage] = useState(1);
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedBlocoId, setSelectedBlocoId] = useState<number | null>(null);
  const navigate = useNavigate();

  const loadBlocos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const ativo =
        statusFilter === 'todos' ? undefined :
          statusFilter === 'ativos' ? true : false;

      const params = {
        page,
        pageSize: ROWS_PER_PAGE,
        busca: search.trim() || undefined,
        ativo,
      };

      console.log('Buscando com params:', params); // ← debug: veja se os filtros chegam

      const data = await blocosService.getBlocos(params);
      setBlocos(data.blocos);
      setTotal(data.total);
      onTotalChange?.(data.total);
    } catch (err) {
      setError('Não foi possível carregar os blocos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, onTotalChange]);

  useEffect(() => {
    loadBlocos();
  }, [page, search, statusFilter, loadBlocos]); 

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleView = useCallback((id: number) => {
    navigate(`/blocos/${id}`); // ou /blocos/visualizar/${id}
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
      await loadBlocos(); // atualiza a lista após exclusão
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

  const handleExportar = useCallback(() => {
    console.log('Exportar lista de blocos');
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(39, 102, 120, 0.42)',
        borderRadius: '12px',
        overflow: 'hidden',
        height: '100%',
        minHeight: '658px',
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
          <Typography
            variant="h5"
            component="h1"
            fontWeight={600}
            color="#276678"
            sx={{ letterSpacing: '-0.5px' }}
          >
            Lista de Blocos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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
              '&:hover': {
                borderColor: 'rgba(39, 102, 120, 0.42)',
                bgcolor: 'rgba(39, 102, 120, 0.04)',
              },
            }}
          >
            Exportar
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNovoBloco}
            sx={{
              bgcolor: '#276678',
              '&:hover': { bgcolor: '#1e4d5a' },
            }}
          >
            Novo Bloco
          </Button>
        </Box>
      </Box>

      {/* Tabela */}
      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}>
              <TableCell sx={{ pl: 4, fontWeight: 600, color: '#276678' }}>
                Nome do Bloco
                <ArrowDropDownIcon sx={{ ml: 1, fontSize: 'small', verticalAlign: 'middle' }} />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#276678' }}>
                Ordem
                <ArrowDropDownIcon sx={{ ml: 1, fontSize: 'small', verticalAlign: 'middle' }} />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#276678' }}>Atividades</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#276678' }}>Status</TableCell>
              <TableCell align="right" sx={{ pr: 4, fontWeight: 600, color: '#276678' }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Typography color="error">{error}</Typography>
                </TableCell>
              </TableRow>
            ) : blocos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">Nenhum bloco encontrado</Typography>
                </TableCell>
              </TableRow>
            ) : (
              blocos.map((bloco) => (
                <TableRow
                  key={bloco.id}
                  hover
                  onClick={() => handleView(bloco.id)} // opcional: clique na linha visualiza
                  sx={{
                    cursor: 'pointer',
                    '&:last-child td, &:last-child th': { border: 0 },
                    borderBottom: '1px solid #e5e7eb',
                    height: 73,
                  }}
                >
                  <TableCell sx={{ pl: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                     {/** <Avatar
                        variant="rounded"
                        sx={{ width: 40, height: 40, bgcolor: 'grey.200' }}
                      >

                      </Avatar> */}
                      <Box>
                        <Typography variant="body1" fontWeight={600} color="#276678">
                          {bloco.titulo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Criado em {new Date(bloco.createdAt).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                    </Box>
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

                  <TableCell sx={{ fontWeight: 500 }}>
                    — atividades
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={bloco.status ? 'Ativo' : 'Inativo'}
                      size="small"
                      sx={{
                        bgcolor: bloco.status ? '#dcfce7' : '#fee2e2',
                        color: bloco.status ? '#15803d' : '#b91c1c',
                        fontWeight: 500,
                        '& .MuiChip-label': { px: 2 },
                      }}
                    />
                  </TableCell>

                  {/* Coluna de Ações - ícones diretos */}
                  <TableCell align="right" sx={{ pr: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="Visualizar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(bloco.id);
                          }}
                          sx={{ color: '#276678' }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(bloco.id);
                          }}
                          sx={{ color: '#276678' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(bloco.id);
                          }}
                          sx={{ color: '#d32f2f' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação e contador */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Mostrando <strong>{blocos.length}</strong> de <strong>{total}</strong> blocos
        </Typography>

        <Pagination
          count={Math.ceil(total / ROWS_PER_PAGE)}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          sx={{
            '& .MuiPaginationItem-root': { borderRadius: '8px' },
            '& .Mui-selected': { bgcolor: '#276678 !important', color: 'white' },
          }}
        />
      </Box>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Confirmar exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este bloco? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            disabled={deleteLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}