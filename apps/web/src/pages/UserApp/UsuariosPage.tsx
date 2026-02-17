// pages/Usuarios.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Modal,
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filtroStatusCadastro, setFiltroStatusCadastro] = useState<
    'todos' | 'cadastrado' | 'naoCadastrado' | 'Inativo'
  >('todos');

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');

  const [openNewUserModal, setOpenNewUserModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [initialData, setInitialData] = useState<Partial<Usuario> | undefined>(undefined);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError('Sessão expirada. Faça login novamente.');
      setLoading(false);
      return;
    }

    const loadUsuarios = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: any = {
          pagina: 1, // sempre 1, pois a paginação é local agora
          tamanhoPagina: 1000, // ou um valor grande para trazer todos os dados
          search: search.trim() || undefined,
        };

        if (filtroStatusCadastro === 'cadastrado') params.ativo = true;
        if (filtroStatusCadastro === 'Inativo') params.ativo = false;
        // 'naoCadastrado' não suportado — só cadastrados

        const data = await fetchUsuariosAdmin(params, token);

        setPaginatedData(data);
        setUsuarios(data.itens || []);
      } catch (err: any) {
        setError(err.message || 'Não foi possível carregar a lista de usuários.');
      } finally {
        setLoading(false);
      }
    };

    loadUsuarios();
  }, [search, filtroStatusCadastro, token]); // sem currentPage na dependência

  // Estatísticas
  const totalUsuarios = paginatedData?.totalItens || 0;
  const usuariosAtivos = usuarios.filter(p => p.ativo).length;
  const percentualAtivos = totalUsuarios > 0 
    ? Math.round((usuariosAtivos / totalUsuarios) * 1000) / 10 
    : 0;

  const statsCards: StatCardData[] = [
    {
      titulo: 'Total de Usuários',
      valor: totalUsuarios.toLocaleString(),
      variacao: '+12%',
      icone: <UsersThree size={32} weight="duotone" />,
      corFundoIcone: '#DBEAFE',
      corIcone: '#2563EB',
    },
    {
      titulo: 'Usuários Ativos',
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
      // Recarrega dados
      setSearch(search); // força re-render do useEffect
    } catch (err: any) {
      setSnackMessage(err.message || 'Erro ao cadastrar professor.');
      setSnackSeverity('error');
    } finally {
      setSnackOpen(true);
    }
  };

  const handleVerPerfil = (user: Usuario) => {
    setSelectedUsuario(user);
    setInitialData({
      idUsuario: user.idUsuario,
      nomeCompleto: user.nomeCompleto,
      email: user.email,
      telefone: user.telefone,
      perfil: user.perfil,
      ativo: user.ativo,
      isEmbaixadora: user.isEmbaixadora,
      idNivelEnsino: user.idNivelEnsino,
      possuiLockout: user.possuiLockout,
      statusConta: user.statusConta,
      expirationDate: user.expirationDate,
    });
    setOpenEditModal(true);
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'grey.50', minHeight: '100vh', pb: 8 }}>
      {/* Cards */}
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

      {/* Busca */}
      <SearchFilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={filtroStatusCadastro}
        setStatusFilter={setFiltroStatusCadastro}
        statusOptions={[
          { value: 'todos', label: 'Todos os Status' },
          { value: 'cadastrado', label: 'Cadastrados' },
          { value: 'Inativo', label: 'Inativos' },
        ]}
        placeholder="Buscar por nome, e-mail ou telefone..."
      />

      {/* Lista */}
      <Box sx={{ px: { xs: 2, md: 4 } }}>
        <UsersListLayout
          filteredUsuarios={usuarios}
          loading={loading}
          error={error}
          onVerPerfil={handleVerPerfil}
          onNovoUsuarioClick={() => setOpenNewUserModal(true)}
        />
      </Box>

      {/* Dialog Novo Usuário */}
      <NewUserDialog
        open={openNewUserModal}
        onClose={() => setOpenNewUserModal(false)}
        onSuccess={() => {
          setSnackMessage('Novo professor cadastrado com sucesso!');
          setSnackSeverity('success');
          setSnackOpen(true);
          setSearch(search); // força recarregar dados
        }}
        onError={(msg) => {
          setSnackMessage(msg);
          setSnackSeverity('error');
          setSnackOpen(true);
        }}
      />

      {/* Modal Edição */}
      <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
        <ProfileUserAppEdit
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          userId={selectedUsuario?.idUsuario ?? 0}
          initialData={initialData}
          onSuccess={() => {
            setSnackMessage('Perfil atualizado com sucesso!');
            setSnackSeverity('success');
            setSnackOpen(true);
            setSearch(search); // força recarregar dados
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