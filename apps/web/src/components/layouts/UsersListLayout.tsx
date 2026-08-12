// components/layouts/UsersListLayout.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  Checkbox,
  Avatar,
  Chip,
  IconButton,
  TablePagination,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Add as AddIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  ViewComfy as ViewComfyIcon,
  ViewCompact as ViewCompactIcon,
} from '@mui/icons-material';
import { Star as StarIcon } from '@phosphor-icons/react';

import type { Usuario } from '../../types/userTypes';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import EmptyState from '../common/EmptyState';

function getExpirationStatus(expirationDate?: string | null) {
  if (!expirationDate) return { label: 'Nunca', chipColor: 'default' as const, formatted: null }
  const exp = new Date(expirationDate)
  const now = new Date()
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const formatted = exp.toLocaleDateString('pt-BR')
  if (diffDays < 0) return { label: 'Expirado', chipColor: 'error' as const, formatted }
  if (diffDays <= 30) return { label: `${formatted} (${diffDays}d)`, chipColor: 'warning' as const, formatted }
  return { label: formatted, chipColor: 'default' as const, formatted }
}

/**
 * StatusConta vem pronto do backend ("Ativa"/"Bloqueada"/"Expirada"), mas não
 * cobre o caso Usuario.IsActive=false — por isso o cruzamento com `ativo` aqui.
 */
function getStatusContaInfo(user: Usuario) {
  if (user.possuiLockout || user.statusConta === 'Bloqueada') {
    return { label: 'Bloqueada', color: 'error' as const }
  }
  if (user.statusConta === 'Expirada') {
    return { label: 'Expirada', color: 'warning' as const }
  }
  if (!user.ativo) {
    return { label: 'Inativo', color: 'default' as const }
  }
  return { label: 'Ativa', color: 'success' as const }
}

function formatDataCadastro(dataCadastro?: string | null) {
  if (!dataCadastro) return '—'
  return new Date(dataCadastro).toLocaleDateString('pt-BR')
}

const AVATAR_COLORS = ['#2563EB', '#16A34A', '#DB2777', '#9333EA', '#EA580C', '#0D9488', '#4F46E5', '#CA8A04']

function corAvatarPorNome(nome: string) {
  let hash = 0
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

interface Props {
  filteredUsuarios: Usuario[];
  loading: boolean;
  error: string | null;
  /** Total de itens no servidor (para o contador de paginação). */
  totalCount: number;
  /** Página atual (0-indexed, padrão MUI). */
  page: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onExportar?: (usuarios: Usuario[]) => void;
  onVerPerfil: (user: Usuario) => void;
  onMaisAcoes?: (user: Usuario) => void;
  onNovoUsuarioClick?: () => void;
}

export function UsersListLayout({
  filteredUsuarios,
  loading,
  error,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onExportar,
  onVerPerfil,
  onMaisAcoes,
  onNovoUsuarioClick,
}: Props) {
  const [densidade, setDensidade] = useState<'confortavel' | 'compacta'>('confortavel');
  const compacta = densidade === 'compacta';

  type CampoOrdenacao = 'nome' | 'expiracao' | 'cadastro';
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacao; direcao: 'asc' | 'desc' } | null>(null);

  const alternarOrdenacao = (campo: CampoOrdenacao) => {
    setOrdenacao((prev) => {
      if (prev?.campo !== campo) return { campo, direcao: 'asc' };
      if (prev.direcao === 'asc') return { campo, direcao: 'desc' };
      return null;
    });
  };

  const displayedUsuarios = useMemo(() => {
    if (!ordenacao) return filteredUsuarios;
    const { campo, direcao } = ordenacao;
    const sinal = direcao === 'asc' ? 1 : -1;

    const valorOrdenavel = (u: Usuario) => {
      if (campo === 'nome') return u.nomeCompleto?.toLowerCase() || '';
      if (campo === 'expiracao') return u.expirationDate ? new Date(u.expirationDate).getTime() : -Infinity;
      return u.dataCadastro ? new Date(u.dataCadastro).getTime() : -Infinity;
    };

    return [...filteredUsuarios].sort((a, b) => {
      const va = valorOrdenavel(a);
      const vb = valorOrdenavel(b);
      if (va < vb) return -1 * sinal;
      if (va > vb) return 1 * sinal;
      return 0;
    });
  }, [filteredUsuarios, ordenacao]);

  const [selecionados, setSelecionados] = useState<number[]>([]);

  useEffect(() => {
    setSelecionados([]);
  }, [page, filteredUsuarios]);

  const todosSelecionados =
    displayedUsuarios.length > 0 && selecionados.length === displayedUsuarios.length;
  const algunsSelecionados = selecionados.length > 0 && !todosSelecionados;

  const toggleSelecionarTodos = () => {
    setSelecionados(todosSelecionados ? [] : displayedUsuarios.map((u) => u.idUsuario));
  };

  const toggleSelecionarUm = (id: number) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const usuariosSelecionados = displayedUsuarios.filter((u) =>
    selecionados.includes(u.idUsuario)
  );

  return (
    <Paper elevation={0} sx={{ overflow: 'hidden', mt: 4 }}>
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
          <Typography variant="h6" color="primary.main" sx={{ letterSpacing: '-0.5px' }}>
            Lista de Usuários
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie e monitore todos os usuários cadastrados
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Tooltip title={compacta ? 'Densidade confortável' : 'Densidade compacta'}>
            <IconButton
              size="small"
              onClick={() => setDensidade(compacta ? 'confortavel' : 'compacta')}
              sx={{ color: 'text.secondary' }}
            >
              {compacta ? <ViewComfyIcon /> : <ViewCompactIcon />}
            </IconButton>
          </Tooltip>

          {selecionados.length > 0 && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={() => onExportar?.(usuariosSelecionados)}
            >
              Exportar selecionados ({selecionados.length})
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => onExportar?.(displayedUsuarios)}
          >
            Exportar
          </Button>

          <Button variant="contained" startIcon={<AddIcon />} onClick={onNovoUsuarioClick}>
            Novo Usuário
          </Button>
        </Stack>
      </Box>

      {/* Conteúdo */}
      {loading ? (
        <LoadingState rows={6} />
      ) : error ? (
        <ErrorState message={error} />
      ) : filteredUsuarios.length === 0 ? (
        <EmptyState
          title="Nenhum usuário encontrado"
          description="Ajuste os filtros de busca ou cadastre um novo usuário."
        />
      ) : (
        <>
          <TableContainer sx={{ overflowX: 'auto', maxHeight: { md: '65vh' } }}>
            <Table stickyHeader size={compacta ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={todosSelecionados}
                      indeterminate={algunsSelecionados}
                      onChange={toggleSelecionarTodos}
                    />
                  </TableCell>
                  <TableCell sortDirection={ordenacao?.campo === 'nome' ? ordenacao.direcao : false}>
                    <TableSortLabel
                      active={ordenacao?.campo === 'nome'}
                      direction={ordenacao?.campo === 'nome' ? ordenacao.direcao : 'asc'}
                      onClick={() => alternarOrdenacao('nome')}
                    >
                      Usuário
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Perfil</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell
                    sx={{ display: { xs: 'none', md: 'table-cell' } }}
                    sortDirection={ordenacao?.campo === 'expiracao' ? ordenacao.direcao : false}
                  >
                    <TableSortLabel
                      active={ordenacao?.campo === 'expiracao'}
                      direction={ordenacao?.campo === 'expiracao' ? ordenacao.direcao : 'asc'}
                      onClick={() => alternarOrdenacao('expiracao')}
                    >
                      Expira em
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sx={{ display: { xs: 'none', xl: 'table-cell' } }}
                    sortDirection={ordenacao?.campo === 'cadastro' ? ordenacao.direcao : false}
                  >
                    <TableSortLabel
                      active={ordenacao?.campo === 'cadastro'}
                      direction={ordenacao?.campo === 'cadastro' ? ordenacao.direcao : 'asc'}
                      onClick={() => alternarOrdenacao('cadastro')}
                    >
                      Cadastrado em
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Embaixadora</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {displayedUsuarios.map((user) => (
                  <TableRow key={user.idUsuario} hover selected={selecionados.includes(user.idUsuario)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={selecionados.includes(user.idUsuario)}
                        onChange={() => toggleSelecionarUm(user.idUsuario)}
                      />
                    </TableCell>

                    <TableCell>
                      <Box
                        className="linha-usuario"
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Avatar sx={{ bgcolor: corAvatarPorNome(user.nomeCompleto || '?') }}>
                          {user.nomeCompleto?.[0] || '?'}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {user.nomeCompleto}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {user.email || '—'}
                            </Typography>
                            {user.email && (
                              <Tooltip title="Copiar e-mail">
                                <IconButton
                                  size="small"
                                  className="botao-copiar-email"
                                  sx={{
                                    p: 0.25,
                                    opacity: 0,
                                    transition: 'opacity 0.15s',
                                    '.linha-usuario:hover &': { opacity: 1 },
                                  }}
                                  onClick={() => navigator.clipboard.writeText(user.email)}
                                >
                                  <ContentCopyIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Chip
                        label={user.roles?.[0] || user.perfil || 'Professor'}
                        size="small"
                        sx={{ bgcolor: '#dbeafe', color: '#1d4ed8' }}
                      />
                    </TableCell>

                    <TableCell>
                      {(() => {
                        const { label, color } = getStatusContaInfo(user)
                        return <Chip label={label} size="small" color={color} />
                      })()}
                    </TableCell>

                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {(() => {
                        const { label, chipColor } = getExpirationStatus(user.expirationDate)
                        return (
                          <Chip
                            label={label}
                            size="small"
                            color={chipColor}
                            variant={chipColor === 'default' ? 'outlined' : 'filled'}
                          />
                        )
                      })()}
                    </TableCell>

                    <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>
                      <Typography variant="body2" color="text.secondary">
                        {formatDataCadastro(user.dataCadastro)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      {user.isEmbaixadora ? (
                        <Chip
                          label="Embaixadora"
                          size="small"
                          color="secondary"
                          icon={<StarIcon fontSize="small" />}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => onVerPerfil(user)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {onMaisAcoes && (
                          <IconButton size="small" onClick={() => onMaisAcoes(user)}>
                            <EditIcon />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginação server-side */}
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
                {Math.min((page + 1) * rowsPerPage, totalCount)}
              </strong>{' '}
              de <strong>{totalCount}</strong> usuários
            </Typography>

            <TablePagination
              rowsPerPageOptions={[25, 50, 100]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_e, newPage) => onPageChange(newPage)}
              onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
              labelRowsPerPage="Linhas por página:"
              sx={{
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  color: 'primary.main',
                },
              }}
            />
          </Box>
        </>
      )}
    </Paper>
  );
}