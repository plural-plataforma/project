// components/layouts/UsersListLayout.tsx
import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
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
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Star as StarIcon } from '@phosphor-icons/react';

import { Usuario } from '../../types/userTypes';

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
  onCadastrar?: (email: string, nome: string) => void;
  onExportar?: () => void;
  onVerPerfil: (user: Usuario) => void;
  onMaisAcoes?: (user: Usuario) => void;
  onNovoUsuarioClick?: () => void;
}

export function UsersListLayout({
  filteredUsuarios,
  loading,
  error,
  onCadastrar,
  onExportar,
  onVerPerfil,
  onMaisAcoes,
  onNovoUsuarioClick,
}: Props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Cálculo dos itens exibidos (paginação local)
  const displayedUsuarios = filteredUsuarios.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '12px',
        border: '1px solid rgba(39, 102, 120, 0.42)',
        overflow: 'hidden',
        bgcolor: '#fff',
        mt: 4,
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
            variant="h6"
            fontWeight={600}
            color="#276678"
            sx={{ letterSpacing: '-0.5px' }}
          >
            Lista de Usuários
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie e monitore todos os usuários cadastrados
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={onExportar}
            sx={{
              borderColor: 'rgba(39, 102, 120, 0.42)',
              color: '#276678',
              textTransform: 'none',
            }}
          >
            Exportar
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNovoUsuarioClick}
            sx={{
              bgcolor: '#276678',
              '&:hover': { bgcolor: '#1e4d5c' },
              textTransform: 'none',
            }}
          >
            Novo Usuário
          </Button>
        </Stack>
      </Box>

      {/* Conteúdo */}
      {loading ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 4 }}>
          {error}
        </Alert>
      ) : filteredUsuarios.length === 0 ? (
        <Alert severity="info" sx={{ m: 4 }}>
          Nenhum usuário encontrado com os filtros aplicados.
        </Alert>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell padding="checkbox">
                  <Checkbox color="primary" />
                </TableCell>
                <TableCell>Usuário</TableCell>
                <TableCell>Perfil</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expira em</TableCell>
                <TableCell>Embaixadora</TableCell>
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
                      <Avatar sx={{ bgcolor: '#276678' }}>
                        {user.nomeCompleto?.[0] || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {user.nomeCompleto}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email || '—'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={user.perfil || 'Professor'}
                      size="small"
                      sx={{
                        bgcolor: '#dbeafe',
                        color: '#1d4ed8',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={user.ativo ? 'Ativo' : 'Inativo'}
                      size="small"
                      color={user.ativo ? 'success' : 'error'}
                    />
                  </TableCell>

                  <TableCell>
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

                  <TableCell>
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
                        sx={{ color: '#276678' }}
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

          {/* Paginação local */}
          <Box
            sx={{
              p: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(39, 102, 120, 0.42)',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography variant="body2" color="#276678">
              Mostrando{' '}
              <strong>
                {page * rowsPerPage + 1} a{' '}
                {Math.min((page + 1) * rowsPerPage, filteredUsuarios.length)}
              </strong>{' '}
              de <strong>{filteredUsuarios.length}</strong> usuários
            </Typography>

            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={filteredUsuarios.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Linhas por página:"
              sx={{
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  color: '#276678',
                },
              }}
            />
          </Box>
        </>
      )}
    </Paper>
  );
}