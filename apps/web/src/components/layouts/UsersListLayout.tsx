// components/layouts/UsersListLayout.tsx
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
  onExportar?: () => void;
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
  const displayedUsuarios = filteredUsuarios;

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

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={onExportar}>
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
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox color="primary" />
                  </TableCell>
                  <TableCell>Usuário</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Perfil</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Expira em</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Embaixadora</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {displayedUsuarios.map((user) => (
                  <TableRow key={user.idUsuario} hover>
                    <TableCell padding="checkbox">
                      <Checkbox color="primary" />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {user.nomeCompleto?.[0] || '?'}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {user.nomeCompleto}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {user.email || '—'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Chip
                        label={user.perfil || 'Professor'}
                        size="small"
                        sx={{ bgcolor: '#dbeafe', color: '#1d4ed8' }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={user.ativo ? 'Ativo' : 'Inativo'}
                        size="small"
                        color={user.ativo ? 'success' : 'error'}
                      />
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