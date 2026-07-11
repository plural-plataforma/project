// pages/SkillsList.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import habilidadesService from '../../services/habilidadesService';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  TablePagination,
  Tooltip,
} from '@mui/material';
import { Download as DownloadIcon, Add as AddIcon, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import StatsGrid, { type StatCardData } from '../../components/StatsGrid';
import SearchFilterBar from '../../components/SearchFilterBar';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

import {
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Chip,
  IconButton,
} from '@mui/material';
import { PersonIcon } from '@phosphor-icons/react';

interface Habilidade {
  id: number;
  tipo: number;
  descricao: string;
  resumo: string;
  ativo: boolean;
  idNivelEnsino: number;
}

export default function SkillsList() {
  const navigate = useNavigate();

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  // Paginação (client-side: o endpoint de habilidades não pagina no servidor)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['habilidades'],
    queryFn: () => habilidadesService.getAllHabilidades(),
  });

  const habilidades = (data ?? []) as unknown as Habilidade[];
  const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar as habilidades.';

  // Filtragem completa (sempre parte da lista completa)
  const filteredHabilidades = habilidades.filter((h) => {
    const matchesSearch =
      h.descricao?.toLowerCase().includes(search.toLowerCase().trim()) ||
      h.resumo?.toLowerCase().includes(search.toLowerCase().trim());

    const matchesStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'ativo' && h.ativo) ||
      (statusFilter === 'inativo' && !h.ativo);

    return matchesSearch && matchesStatus;
  });

  // Resetar página ao mudar filtro ou busca
  useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  // Paginação
  const paginatedHabilidades = filteredHabilidades.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTipoLabel = (tipo: number) => {
    const tipos: Record<number, string> = {
      1: 'Cognitivo',
      2: 'Socioemocional',
      3: 'Comunicação',
      4: 'Motora',
    };
    return tipos[tipo] || 'Desconhecido';
  };

  const getNivelEnsinoLabel = (id: number) => {
    const niveis: Record<number, string> = {
      1: 'Educação Infantil',
      2: 'Ensino Fundamental I',
      3: 'Ensino Fundamental II',
      4: 'Ensino Médio',
    };
    return niveis[id] || 'Desconhecido';
  };

  // Dados para StatsGrid (cards superiores)
  const statsCards: StatCardData[] = [
    {
      titulo: 'Habilidades Ativas',
      valor: habilidades.filter((h) => h.ativo).length.toLocaleString(),
      variacao: '+25',
      icone: <PersonIcon fontSize="large" />,
      corFundoIcone: '#eff6ff',
      corIcone: '#2563eb',
    },
    {
      titulo: 'Atividades',
      valor: habilidades.length.toLocaleString(),
      variacao: '+42',
      icone: <PersonIcon fontSize="large" />,
      corFundoIcone: '#f0fdf4',
      corIcone: '#16a34a',
    },
  ];

  return (
    <Box sx={{ width: '100%', bgcolor: 'grey.50', p: { xs: 2, md: 4 } }}>
      {/* Cards superiores */}
      <Box sx={{ mb: 5 }}>
        <StatsGrid cards={statsCards} spacing={3} />


        {/* Barra de busca e filtros */}
        <SearchFilterBar
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statusOptions={[
            { value: 'todos', label: 'Todos os Status' },
            { value: 'ativo', label: 'Ativo' },
            { value: 'inativo', label: 'Inativo' },
          ]}
          placeholder="Buscar por descrição ou resumo..."
        />
      </Box>
      {/* Lista de Habilidades */}
      <Paper sx={{ mt: 4, overflow: 'hidden' }}>
        {/* Cabeçalho */}
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" color="primary.main">
              Lista de Habilidades
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie e monitore todas as habilidades cadastradas
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Exportar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/skills/new')}
            >
              Nova Habilidade
            </Button>
          </Stack>
        </Box>

        {/* Tabela */}
        {isLoading ? (
          <LoadingState rows={6} />
        ) : isError ? (
          <ErrorState message={errorMessage} onRetry={() => refetch()} />
        ) : filteredHabilidades.length === 0 ? (
          <EmptyState
            title="Nenhuma habilidade encontrada"
            description="Ajuste os filtros de busca ou cadastre uma nova habilidade."
          />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox />
                    </TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>ID</TableCell>
                    <TableCell>Descrição / Resumo</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Ativo</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Nível Ensino</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedHabilidades.map((hab) => (
                    <TableRow key={hab.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTipoLabel(hab.tipo)}
                          size="small"
                          sx={{ bgcolor: '#dbeafe', color: '#1d4ed8' }}
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{hab.id}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {hab.descricao}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {hab.resumo}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Chip
                          label={hab.ativo ? 'Sim' : 'Não'}
                          size="small"
                          color={hab.ativo ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {getNivelEnsinoLabel(hab.idNivelEnsino)}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/skills/edit/${hab.id}`, { state: hab })}
                            sx={{ color: 'primary.main' }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginação */}
            <Box
              sx={{
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid',
                borderColor: 'divider',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Typography variant="body2" color="primary.main">
                Mostrando{' '}
                <strong>
                  {page * rowsPerPage + 1} a{' '}
                  {Math.min((page + 1) * rowsPerPage, filteredHabilidades.length)}
                </strong>{' '}
                de <strong>{filteredHabilidades.length}</strong> resultados
              </Typography>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredHabilidades.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Linhas por página:"
              />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}