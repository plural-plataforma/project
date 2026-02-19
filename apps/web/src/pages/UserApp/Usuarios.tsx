// pages/Usuarios.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Modal,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import SearchFilterBar from '../../components/SearchFilterBar';
import { UsersListLayout } from '../../components/layouts/UsersListLayout';
import ProfileUserAppEdit from './ProfileUserApp';
import { Usuario } from '../../types/userTypes';
import StatsGrid, { StatCardData } from '../../components/StatsGrid';

import { UsersThree, UserCheck } from '@phosphor-icons/react';

import { fetchUsuariosAdmin, PaginatedUsuarios } from '../../services/adminService';
import { registerUser } from '../../services/authService';
import NewUserDialog from '../../components/dialogs/NewUserDialog';

export default function UsuariosPage() {
  const theme = useTheme();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [paginatedData, setPaginatedData] = useState<PaginatedUsuarios | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filtroStatusCadastro, setFiltroStatusCadastro] = useState<
    'todos' | 'ativos' | 'inativos'
  >('todos');

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');

  const [openNewUserModal, setOpenNewUserModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<Usuario | null>(null);
  const [initialData, setInitialData] = useState<Partial<Usuario> | undefined>(undefined);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError('Sessão expirada. Faça login novamente.');
      setLoading(false);
      return;
    }

    const loadProfessores = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: any = {
          pagina: currentPage,
          tamanhoPagina: 20,
          search: search.trim() || undefined,
        };

        if (filtroStatusCadastro === 'ativos') params.ativo = true;
        if (filtroStatusCadastro === 'inativos') params.ativo = false;

        const data = await fetchUsuariosAdmin(params, token);

        setPaginatedData(data);
        setUsuarios(data.itens || []);
      } catch (err: any) {
        setError(err.message || 'Não foi possível carregar a lista de professores.');
      } finally {
        setLoading(false);
      }
    };

    loadProfessores();
  }, [currentPage, search, filtroStatusCadastro, token]);

  // Estatísticas
  const totalProfessores = paginatedData?.totalItens || 0;
  const usuariosAtivos = usuarios.filter(p => p.ativo).length;
  const percentualAtivos = totalProfessores > 0 
    ? Math.round((usuariosAtivos / totalProfessores) * 1000) / 10 
    : 0;

  const statsCards: StatCardData[] = [
    {
      titulo: 'Total de Professores',
      valor: totalProfessores.toLocaleString(),
      variacao: '+12%',
      icone: <UsersThree size={32} weight="duotone" />,
      corFundoIcone: '#DBEAFE',
      corIcone: '#2563EB',
    },
    {
      titulo: 'Professores Ativos',
      valor: usuariosAtivos.toLocaleString(),
      variacao: `${percentualAtivos}% do total`,
      icone: <UserCheck size={32} weight="duotone" />,
      corFundoIcone: '#DCFCE7',
      corIcone: '#16A34A',
    },
  ];

  const handleCadastrarProfessor = async (email: string, nome: string) => {
    if (!email?.trim() || !nome?.trim()) {
      setSnackMessage('E-mail ou nome não informado.');
      setSnackSeverity('error');
      setSnackOpen(true);
      return;
    }

    try {
      await registerUser({
        email: email.trim(),
        senha: 'Plural@2025',
        nomeCompleto: nome.trim(),
        aceitouTermos: true,
        deveAlterarSenha: true,
      });

      setSnackMessage(`Professor ${nome} cadastrado com sucesso! Senha inicial: Plural@2025.`);
      setSnackSeverity('success');
      setCurrentPage(1);
    } catch (err: any) {
      setSnackMessage(err.message || 'Erro ao cadastrar professor.');
      setSnackSeverity('error');
    } finally {
      setSnackOpen(true);
    }
  };

  const handleVerPerfil = (prof: Usuario) => {
    setSelectedProfessor(prof);
    setInitialData({
      idUsuario: prof.idUsuario,
      nomeCompleto: prof.nomeCompleto,
      email: prof.email,
      telefone: prof.telefone,
      perfil: prof.perfil,
      ativo: prof.ativo,
      isEmbaixadora: prof.isEmbaixadora,
      possuiLockout: prof.possuiLockout,
      statusConta: prof.statusConta,
      expirationDate: prof.expirationDate,
    });
    setOpenEditModal(true);
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'grey.50', minHeight: '100vh', pb: 8 }}>
      {/* Cards de estatísticas */}
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <StatsGrid cards={statsCards} spacing={3} />
        )}
      </Box>

      {/* Barra de busca */}
      <SearchFilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={filtroStatusCadastro}
        setStatusFilter={setFiltroStatusCadastro}
        statusOptions={[
          { value: 'todos', label: 'Todos os Status' },
          { value: 'cadastrado', label: 'Ativos' },
          { value: 'Inativo', label: 'Inativos' },
        ]}
        placeholder="Buscar por nome, e-mail ou telefone..."
      />

      {/* Lista principal */}
      <Box sx={{ px: { xs: 2, md: 4 } }}>
        <UsersListLayout
          filteredUsuarios={usuarios}
          loading={loading}
          error={error}
          onVerPerfil={handleVerPerfil}
          onNovoUsuarioClick={() => setOpenNewUserModal(true)}
        />

        {paginatedData && paginatedData.totalPaginas > 1 && (
          <Stack alignItems="center" sx={{ mt: 4, mb: 6 }}>
            <Pagination
              count={paginatedData.totalPaginas}
              page={paginatedData.paginaAtual}
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
              showFirstButton
              showLastButton
              size="large"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Mostrando {usuarios.length} de {paginatedData.totalItens} usuários
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Dialog Novo Professor */}
      <NewUserDialog
        open={openNewUserModal}
        onClose={() => setOpenNewUserModal(false)}
        onSuccess={() => {
          setSnackMessage('Novo professor cadastrado com sucesso!');
          setSnackSeverity('success');
          setSnackOpen(true);
          setCurrentPage(1);
        }}
        onError={(msg) => {
          setSnackMessage(msg);
          setSnackSeverity('error');
          setSnackOpen(true);
        }}
      />

      {/* Modal Edição de Perfil do Professor */}
      <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
        <ProfileUserAppEdit
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          userId={selectedProfessor?.idUsuario ?? 0}
          initialData={initialData}
          onSuccess={() => {
            setSnackMessage('Perfil do professor atualizado com sucesso!');
            setSnackSeverity('success');
            setSnackOpen(true);
            setCurrentPage(currentPage);
          }}
        />
      </Modal>

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