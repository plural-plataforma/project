import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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

import { fetchHotmartSales, HotmartSale } from '../../services/hotmartService';
import { registerUser } from '../../services/authService';
import NewUserDialog from '../../components/dialogs/NewUserDialog'; // ← novo componente

const FIXED_PRODUCT_ID = '6420317';
const FIXED_FROM_DATE = '01/06/2025';

export default function UsuariosPage() {
  const theme = useTheme();

  const [sales, setSales] = useState<HotmartSale[]>([]);
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
  const [selectedSale, setSelectedSale] = useState<HotmartSale | null>(null);
  const [initialData, setInitialData] = useState<Partial<Usuario> | undefined>(undefined);

  useEffect(() => {
    const loadSales = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedSales = await fetchHotmartSales({
          productId: FIXED_PRODUCT_ID,
          from: FIXED_FROM_DATE,
          to: undefined,
          transactionStatus: ' ',
        });

        setSales(Array.isArray(fetchedSales) ? fetchedSales : []);
      } catch (err: any) {
        console.error('Erro ao carregar vendas Hotmart:', err);
        setError(err.message || 'Não foi possível carregar os dados.');
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, []);

  // Estatísticas
  const totalCompradores = sales.length;
  const cadastrados = sales.filter((p) => p.jaCadastradoComoProfessor).length;
  const percentualAtivos =
    totalCompradores > 0 ? Math.round((cadastrados / totalCompradores) * 1000) / 10 : 0;

  const statsCards: StatCardData[] = [
    {
      titulo: 'Total de Usuários',
      valor: totalCompradores.toLocaleString(),
      variacao: '+12%',
      icone: <UsersThree size={32} weight="duotone" />,
      corFundoIcone: '#DBEAFE',
      corIcone: '#2563EB',
    },
    {
      titulo: 'Usuários Ativos',
      valor: cadastrados.toLocaleString(),
      variacao: `${percentualAtivos}% do total`,
      icone: <UserCheck size={32} weight="duotone" />,
      corFundoIcone: '#DCFCE7',
      corIcone: '#16A34A',
    },
  ];

  const filteredSales = sales.filter((prof) => {
    const searchTerm = search.toLowerCase().trim();
    const nome = prof.buyerName?.toLowerCase() ?? '';
    const email = prof.buyerEmail?.toLowerCase() ?? '';

    const matchesSearch = searchTerm === '' || nome.includes(searchTerm) || email.includes(searchTerm);

    const isCadastrado = prof.jaCadastradoComoProfessor === true;
    const isAtivo = prof.ativo === true;

    const matchesStatus =
      filtroStatusCadastro === 'todos' ||
      (filtroStatusCadastro === 'cadastrado' && isCadastrado && isAtivo) ||
      (filtroStatusCadastro === 'naoCadastrado' && !isCadastrado) ||
      (filtroStatusCadastro === 'Inativo' && isCadastrado && !isAtivo);

    return matchesSearch && matchesStatus;
  });

  const mapNivelToId = (nivel: string): number | undefined => {
    const map: Record<string, number> = {
      'Educação Infantil': 1,
      'Ensino Fundamental I - Anos Iniciais': 2,
      'Ensino Fundamental II - Anos Finais': 3,
      'Ensino Médio': 4,
    };
    return map[nivel] || undefined;
  };

  const cadastrarProfessor = async (email: string, nome: string) => {
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

      setSales((prev) =>
        prev.map((p) =>
          p.buyerEmail?.toLowerCase() === email.toLowerCase()
            ? { ...p, jaCadastradoComoProfessor: true, ativo: true }
            : p
        )
      );

      setSnackMessage(`Professor ${nome} cadastrado com sucesso! Senha inicial: Plural@2025.`);
      setSnackSeverity('success');
    } catch (err: any) {
      setSnackMessage(err.message || 'Erro ao cadastrar professor.');
      setSnackSeverity('error');
    } finally {
      setSnackOpen(true);
    }
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Cards de estatísticas */}
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 3, pb: 5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ py: 4 }}>
            {error}
          </Typography>
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
          { value: 'cadastrado', label: 'Cadastrados' },
          { value: 'naoCadastrado', label: 'Não Cadastrados' },
          { value: 'Inativo', label: 'Inativos' },
        ]}
        placeholder="Buscar por nome ou e-mail do usuário..."
      />

      {/* Lista de usuários */}
      <Box sx={{ px: { xs: 2, md: 4 }, pb: 6 }}>
        <UsersListLayout
          filteredProfessores={filteredSales}
          loading={loading}
          error={error}
          onCadastrar={cadastrarProfessor}
          onVerPerfil={(prof) => {
            setSelectedSale(prof);
            setInitialData({
              idUsuario: prof.professorId,
              nome: prof.buyerName,
              email: prof.buyerEmail || '',
              telefone: prof.telefone,
              perfil: prof.roles?.[0],
              ativo: prof.ativo,
              idNivelEnsino: mapNivelToId(prof.nivelEnsino),
              isEmbaixadora: prof.isEmbaixadora,
            });
            setOpenEditModal(true);
          }}
          onNovoUsuarioClick={() => setOpenNewUserModal(true)}
        />
      </Box>

      {/* Dialog de Novo Usuário */}
      <NewUserDialog
        open={openNewUserModal}
        onClose={() => setOpenNewUserModal(false)}
        onSuccess={(email, name) => {
          setSnackMessage(`Novo usuário ${name} cadastrado com sucesso! Senha inicial informada.`);
          setSnackSeverity('success');
          setSnackOpen(true);
          // Opcional: recarregar a lista de vendas se desejar atualizar stats
        }}
        onError={(msg) => {
          setSnackMessage(msg);
          setSnackSeverity('error');
          setSnackOpen(true);
        }}
      />

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

      {/* Modal de edição de perfil */}
      <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
        <ProfileUserAppEdit
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          userId={selectedSale?.professorId ?? 0}
          initialData={initialData}
        />
      </Modal>
    </Box>
  );
}