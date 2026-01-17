// pages/Usuarios.tsx - versão final ajustada (sem espaço à esquerda)
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Button,
  Chip,
  Avatar,
  InputBase,
  alpha,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL;

interface Professor {
  transaction: string;
  buyerName: string;
  buyerEmail?: string;
  jaCadastradoComoProfessor?: boolean;
  professorId: number;
  nivelEnsino: string;
  ativo: boolean;
  roles: string[];
  telefone: number;
  perfil: string;
  isEmbaixadora: boolean;
}

export default function Usuarios() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo' | 'naoCadastrado'>('todos');
  const [selected, setSelected] = useState<string[]>([]);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchProfessores = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        setError('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/vendas/hotmart`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data.data || [];
        setProfessores(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao carregar usuários:', err);
        setError('Não foi possível carregar a lista de usuários.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessores();
  }, []);

  // Seleção múltipla
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(professores.map(p => p.transaction));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (transaction: string) => {
    setSelected(prev =>
      prev.includes(transaction)
        ? prev.filter(id => id !== transaction)
        : [...prev, transaction]
    );
  };

  // Filtro
  const filteredProfessores = professores.filter(prof => {
    const matchesSearch =
      prof.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
      prof.buyerEmail?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filtroStatus === 'todos' ||
      (filtroStatus === 'ativo' && prof.jaCadastradoComoProfessor && prof.ativo) ||
      (filtroStatus === 'inativo' && prof.jaCadastradoComoProfessor && !prof.ativo) ||
      (filtroStatus === 'naoCadastrado' && !prof.jaCadastradoComoProfessor);

    return matchesSearch && matchesStatus;
  });

  return (
    <Box
      sx={{
        width: '100%',
        margin: 0,
        padding: 0,                    
        bgcolor: 'grey.50',
      }}
    >
      {/* Barra superior com busca e botões - com padding apenas aqui */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{
          px: { xs: 2, lg: 4 },       // ← padding lateral apenas nessa barra
          pt: { xs: 2, lg: 3 },
          pb: 3,
        }}
      >
        <Box sx={{ position: 'relative', flexGrow: 1, maxWidth: 500 }}>
          <SearchIcon
            sx={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'text.secondary',
            }}
          />
          <InputBase
            placeholder="Buscar por nome ou e-mail..."
            fullWidth
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{
              pl: 6,
              pr: 2,
              py: 1,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: alpha('#276678', 0.42),
              borderRadius: 2,
            }}
          />
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<FilterIcon />}>
            Filtrar
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ bgcolor: '#276678', '&:hover': { bgcolor: '#1e4d5a' } }}
          >
            Novo Usuário
          </Button>
        </Stack>
      </Stack>

      {/* Tabela - colada na borda esquerda */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, px: { xs: 2, lg: 4 } }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ px: { xs: 2, lg: 4 }, py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            mx: { xs: 0, lg: 0 },       // sem margem lateral
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < professores.length}
                      checked={selected.length === professores.length && professores.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Usuário</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Último Acesso</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredProfessores.map(prof => {
                  const isSelected = selected.includes(prof.transaction);
                  const statusText = prof.jaCadastradoComoProfessor
                    ? (prof.ativo ? 'Ativo' : 'Inativo')
                    : 'Não cadastrado';

                  return (
                    <TableRow key={prof.transaction} hover selected={isSelected}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelect(prof.transaction)}
                        />
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: '#276678' }}>
                            {prof.buyerName?.[0] || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">{prof.buyerName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {prof.buyerEmail || '—'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={prof.roles?.[0] || 'Professor'}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={statusText}
                          size="small"
                          color={
                            statusText === 'Ativo' ? 'success' :
                            statusText === 'Inativo' ? 'error' :
                            'warning'
                          }
                        />
                      </TableCell>

                      <TableCell>Há 2 horas</TableCell>

                      <TableCell align="right">
                        <IconButton size="small">
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid',
              borderColor: 'grey.200',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Mostrando {filteredProfessores.length} de {professores.length} resultados
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}