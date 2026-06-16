// pages/Usuarios.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Modal,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import SearchFilterBar, { type FiltroExpiracao } from '../../components/SearchFilterBar';
import { UsersListLayout } from '../../components/layouts/UsersListLayout';
import ProfileUserAppEdit from './ProfileUserApp';
import { Usuario } from '../../types/userTypes';
import StatsGrid, { StatCardData } from '../../components/StatsGrid';

import { UsersThree, UserCheck, Warning } from '@phosphor-icons/react';

import { fetchUsuariosAdmin, PaginatedUsuarios } from '../../services/adminService';
import { registerUser } from '../../services/authService';
import NewUserDialog from '../../components/dialogs/NewUserDialog';

export default function UsuariosPage() {
  const theme = useTheme();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filtroStatusCadastro, setFiltroStatusCadastro] = useState<
    'todos' | 'cadastrado' | 'Inativo'
  >('todos');
  const [filtroExpiracao, setFiltroExpiracao] = useState<FiltroExpiracao>('todos');

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');

  const [openNewUserModal, setOpenNewUserModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [initialData, setInitialData] = useState<Partial<Usuario> | undefined>(undefined);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // Função de carregamento extraída para poder chamar várias vezes
  const loadUsuarios = useCallback(async () => {
    if (!token) {
      setError('Sessão expirada. Faça login novamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: any = {
        // tente 5000, 9999 ou deixe vazio — depende do backend
        // tamanhoPagina: 5000,
      };

      const data: PaginatedUsuarios = await fetchUsuariosAdmin(params, token);
      setUsuarios(data.itens || []);
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Carrega inicialmente
  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  // Filtro local
  const filteredUsuarios = useMemo(() => {
    const term = search.toLowerCase().trim();
    const now = new Date()

    return usuarios.filter((user) => {
      const matchesSearch =
        !term ||
        (user.nomeCompleto?.toLowerCase().includes(term) ?? false) ||
        (user.email?.toLowerCase().includes(term) ?? false);

      const matchesStatus =
        filtroStatusCadastro === 'todos' ||
        (filtroStatusCadastro === 'cadastrado' && user.ativo === true) ||
        (filtroStatusCadastro === 'Inativo' && user.ativo === false);

      let matchesExpiracao = true
      if (filtroExpiracao !== 'todos') {
        if (!user.expirationDate) {
          matchesExpiracao = false
        } else {
          const exp = new Date(user.expirationDate)
          const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (filtroExpiracao === 'expirado') matchesExpiracao = diffDays < 0
          else {
            const dias = Number(filtroExpiracao)
            matchesExpiracao = diffDays >= 0 && diffDays <= dias
          }
        }
      }

      return matchesSearch && matchesStatus && matchesExpiracao;
    });
  }, [usuarios, search, filtroStatusCadastro, filtroExpiracao]);

  // Estatísticas
  const totalUsuarios = usuarios.length;
  const usuariosAtivos = usuarios.filter((u) => u.ativo).length;
  const percentualAtivos =
    totalUsuarios > 0 ? Math.round((usuariosAtivos / totalUsuarios) * 1000) / 10 : 0;

  const now = new Date()
  const expirandoEm60 = usuarios.filter((u) => {
    if (!u.expirationDate) return false
    const diff = Math.ceil((new Date(u.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 60
  }).length
  const expirados = usuarios.filter((u) => {
    if (!u.expirationDate) return false
    return new Date(u.expirationDate) < now
  }).length

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
    {
      titulo: 'Expiram em 60 dias',
      valor: expirandoEm60.toLocaleString(),
      variacao: expirados > 0 ? `+${expirados} já expirado${expirados !== 1 ? 's' : ''}` : 'Nenhum expirado',
      icone: <Warning size={32} weight="duotone" />,
      corFundoIcone: '#FFF3E0',
      corIcone: '#E65100',
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
      await loadUsuarios(); // ← recarrega a lista
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
      roles: user.roles || [],
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
        expirationFilter={filtroExpiracao}
        setExpirationFilter={setFiltroExpiracao}
      />

      <Box sx={{ px: { xs: 2, md: 4 } }}>
        <UsersListLayout
          filteredUsuarios={filteredUsuarios}
          loading={loading}
          error={error}
          onVerPerfil={handleVerPerfil}
          onNovoUsuarioClick={() => setOpenNewUserModal(true)}
        />
      </Box>

      <NewUserDialog
        open={openNewUserModal}
        onClose={() => setOpenNewUserModal(false)}
        onSuccess={async () => {
          setSnackMessage('Novo professor cadastrado com sucesso!');
          setSnackSeverity('success');
          setSnackOpen(true);
          await loadUsuarios(); // ← recarrega após criar
        }}
        onError={(msg) => {
          setSnackMessage(msg);
          setSnackSeverity('error');
          setSnackOpen(true);
        }}
      />

      <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
        <ProfileUserAppEdit
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          userId={selectedUsuario?.idUsuario ?? 0}
          initialData={initialData}
          onSuccess={async () => {
            setSnackMessage('Perfil atualizado com sucesso!');
            setSnackSeverity('success');
            setSnackOpen(true);
            await loadUsuarios(); // ← recarrega após editar
          }}
        />
      </Modal>

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