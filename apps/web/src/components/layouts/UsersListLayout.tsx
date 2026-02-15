// components/layouts/UsersListLayout.tsx
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
} from '@mui/material';
import {
  Download as DownloadIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';

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

interface Props {
  filteredProfessores: Professor[];
  loading: boolean;
  error: string | null;
  onCadastrar?: (email: string, nome: string) => void;
  onExportar?: () => void;
  onVerPerfil: (prof: Professor) => void;
  onMaisAcoes?: (prof: Professor) => void;
  onNovoUsuarioClick?: () => void;
}


export function UsersListLayout({
  filteredProfessores,
  loading,
  error,
  onCadastrar,
  onExportar,
  onVerPerfil,
  onMaisAcoes,
  onNovoUsuarioClick
}: Props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Resetar página para 0 TODA VEZ que filteredProfessores mudar (força re-render completo)
  useEffect(() => {
    setPage(0);
  }, [filteredProfessores]); // Dependência direta no array (React detecta mudanças profundas)

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const displayedUsers = filteredProfessores.slice(
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
  onClick={onNovoUsuarioClick}  // ← aqui! substitua o onCadastrar por isso
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
      ) : filteredProfessores.length === 0 ? (
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
                <TableCell>Tipo</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Último Acesso</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {displayedUsers.map((prof) => (
                <TableRow key={prof.professorId} hover>
                  <TableCell padding="checkbox">
                    <Checkbox color="primary" />
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={prof.fotoPerfil}
                        alt={prof.buyerName}
                        sx={{ width: 40, height: 40 }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {prof.buyerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {prof.buyerEmail || '—'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={prof.perfil || 'Professor'}
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
                      label={
                        prof.jaCadastradoComoProfessor
                          ? prof.ativo
                            ? 'Ativo'
                            : 'Inativo'
                          : 'Não cadastrado'
                      }
                      size="small"
                      color={
                        !prof.jaCadastradoComoProfessor
                          ? 'warning'
                          : prof.ativo
                            ? 'success'
                            : 'error'
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      Há 2 horas {/* Substitua quando tiver campo real */}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    {prof.jaCadastradoComoProfessor ? (
                      <IconButton
                        size="small"
                        onClick={() => onVerPerfil(prof)}
                        sx={{ color: '#276678' }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() =>
                          prof.buyerEmail && onCadastrar?.(prof.buyerEmail, prof.buyerName)
                        }
                        disabled={!prof.buyerEmail}
                      >
                        Cadastrar
                      </Button>
                    )}
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
              borderTop: '1px solid rgba(39, 102, 120, 0.42)',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography variant="body2" color="#276678">
              Mostrando{' '}
              <strong>
                {filteredProfessores.length > 0 ? page * rowsPerPage + 1 : 0} a{' '}
                {Math.min((page + 1) * rowsPerPage, filteredProfessores.length)}
              </strong>{' '}
              de <strong>{filteredProfessores.length}</strong> resultados
            </Typography>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredProfessores.length}
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