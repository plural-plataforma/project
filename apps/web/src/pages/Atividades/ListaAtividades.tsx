'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FileDownload as ExportIcon,
  Image as ImageIcon,
  HideImage as HideImageIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import atividadesService from '../../services/atividadesService';
import blocosService from '../../services/blocosService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

interface ListaAtividadesProps {
  search: string;
  statusFilter: 'todos' | 'ativo' | 'inativo';
}

const ROWS_PER_PAGE = 10;

export function atividadesQueryKey(search: string, statusFilter: string, page: number) {
  return ['atividades', { search, statusFilter, page }] as const;
}

export default function ListaAtividades({ search, statusFilter }: ListaAtividadesProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);

  const ativo = statusFilter === 'todos' ? undefined : statusFilter === 'ativo';

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: atividadesQueryKey(search, statusFilter, page),
    queryFn: () =>
      atividadesService.getAtividadesPaginado({
        busca: search.trim() || undefined,
        ativo,
        page,
        pageSize: ROWS_PER_PAGE,
      }),
  });

  const atividades = data?.itens ?? [];

  // Nomes dos blocos para exibição na tabela (mapa carregado uma única vez e cacheado)
  const { data: blocosAtivos = [] } = useQuery({
    queryKey: ['blocos-ativos'],
    queryFn: () => blocosService.getAllBlocosAtivos(),
  });

  const blocosMap = useMemo(
    () => new Map(blocosAtivos.map((b) => [b.id, b.titulo])),
    [blocosAtivos]
  );

  const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar as atividades.';

  // Agora o backend pagina de verdade e retorna o total real de itens.
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / ROWS_PER_PAGE));

  const deleteMutation = useMutation({
    mutationFn: (id: number) => atividadesService.deleteAtividade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
    },
  });

  const handleNovaAtividade = () => navigate('/atividades/novo');
  const handleExportar = () => console.log('Exportar lista (implemente CSV/Excel real)');
  const handleVisualizar = (id: number) => navigate(`/atividades/${id}`);
  const handleEditar = (id: number) => navigate(`/atividades/${id}/editar`);

  const handleExcluir = (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.')) {
      return;
    }
    deleteMutation.mutate(id);
  };

  return (
    <Paper elevation={0} sx={{ overflow: 'hidden' }}>
      {/* Cabeçalho + botões */}
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
            Lista de Atividades
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie todo o banco de atividades do sistema
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExportar}>
            Exportar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleNovaAtividade}>
            Nova Atividade
          </Button>
        </Box>
      </Box>

      {isLoading && <LoadingState rows={5} />}

      {isError && <ErrorState message={errorMessage} onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {deleteMutation.isError && (
            <Box sx={{ px: 3, pt: 2 }}>
              <ErrorState message={(deleteMutation.error as Error).message || 'Não foi possível excluir a atividade.'} />
            </Box>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 4 }}>Nome da Atividade</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Bloco</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Nível</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Imagem</TableCell>
                  <TableCell align="right" sx={{ pr: 4 }}>
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
                      <Typography fontWeight={600} color="primary.main">
                        {atividade.titulo || 'Sem título'}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Chip
                        label={blocosMap.get(atividade.blocoId) || 'Sem bloco'}
                        size="small"
                        sx={{ bgcolor: '#f3f4f6', fontWeight: 500 }}
                      />
                    </TableCell>

                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
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
                        color={atividade.ativo ? 'success' : 'error'}
                      />
                    </TableCell>

                    <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      <Tooltip title={atividade.imagemUrl ? 'Com imagem' : 'Sem imagem'}>
                        {atividade.imagemUrl ? (
                          <ImageIcon fontSize="small" color="primary" />
                        ) : (
                          <HideImageIcon fontSize="small" sx={{ color: '#d1d5db' }} />
                        )}
                      </Tooltip>
                    </TableCell>

                    <TableCell align="right" sx={{ pr: 4 }}>
                      <Tooltip title="Visualizar">
                        <IconButton size="small" onClick={() => handleVisualizar(atividade.id)}>
                          <VisibilityIcon fontSize="small" color="primary" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEditar(atividade.id)}>
                          <EditIcon fontSize="small" color="primary" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Excluir">
                        <IconButton size="small" onClick={() => handleExcluir(atividade.id)} disabled={deleteMutation.isPending}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {atividades.length === 0 && (
            <EmptyState
              title="Nenhuma atividade encontrada"
              description="Ajuste os filtros de busca ou cadastre uma nova atividade."
            />
          )}

          {/* Paginação server-side */}
          {atividades.length > 0 && (
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
                Mostrando <strong>{atividades.length}</strong> {page > 1 ? `(página ${page})` : ''} atividades
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
    </Paper>
  );
}
