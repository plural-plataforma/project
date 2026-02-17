// pages/SkillsList.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
  TablePagination,
} from '@mui/material';
import { Download as DownloadIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import StatsGrid, { StatCardData } from '../../components/StatsGrid';
import SearchFilterBar from '../../components/SearchFilterBar';

import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Chip,
  IconButton,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { PersonIcon } from '@phosphor-icons/react';

const API_URL = import.meta.env.VITE_API_URL;

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

  const [habilidades, setHabilidades] = useState<Habilidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  // Paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchHabilidades = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Token não encontrado. Faça login novamente.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/Habilidade/buscar`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data?.objeto || [];
        setHabilidades(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao carregar habilidades:', err);
        setError('Erro ao carregar as habilidades.');
      } finally {
        setLoading(false);
      }
    };

    fetchHabilidades();
  }, []);

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
      <Paper
        sx={{
          mt: 4,
          borderRadius: '12px',
          border: '1px solid rgba(39, 102, 120, 0.42)',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho */}
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600} color="#276678">
              Lista de Habilidades
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie e monitore todas as habilidades cadastradas
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{
                borderColor: 'rgba(39,102,120,0.42)',
                color: '#276678',
                textTransform: 'none',
              }}
            >
              Exportar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                bgcolor: '#276678',
                '&:hover': { bgcolor: '#1e4d5c' },
                textTransform: 'none',
              }}
              onClick={() => navigate('/skills/new')}
            >
              Nova Habilidade
            </Button>
          </Stack>
        </Box>

        {/* Tabela */}
        {loading ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 4 }}>
            {error}
          </Alert>
        ) : filteredHabilidades.length === 0 ? (
          <Alert severity="info" sx={{ m: 4 }}>
            Nenhuma habilidade encontrada com os filtros aplicados.
          </Alert>
        ) : (
          <>
            <Table>
              <TableHead sx={{ bgcolor: '#f9fafb' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Descrição / Resumo</TableCell>
                  <TableCell>Ativo</TableCell>
                  <TableCell>Nível Ensino</TableCell>
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
                    <TableCell>{hab.id}</TableCell>
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
                    <TableCell>
                      <Chip
                        label={hab.ativo ? 'Sim' : 'Não'}
                        size="small"
                        color={hab.ativo ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{getNivelEnsinoLabel(hab.idNivelEnsino)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/skills/edit/${hab.id}`)}
                        sx={{ color: '#276678' }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginação */}
            <Box
              sx={{
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(39,102,120,0.42)',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Typography variant="body2" color="#276678">
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