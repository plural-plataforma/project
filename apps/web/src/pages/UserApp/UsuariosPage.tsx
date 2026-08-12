// pages/UserApp/UsuariosPage.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';

import SearchFilterBar, { type FiltroExpiracao } from '../../components/SearchFilterBar';
import { UsersListLayout } from '../../components/layouts/UsersListLayout';
import ProfileUserAppEdit from './ProfileUserApp';
import type { Usuario } from '../../types/userTypes';
import StatsGrid, { type StatCardData } from '../../components/StatsGrid';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

import { UsersThree, UserCheck, Warning, UserPlus } from '@phosphor-icons/react';

import { fetchUsuariosAdmin } from '../../services/adminService';
import NewUserDialog from '../../components/dialogs/NewUserDialog';

const DEBOUNCE_MS = 400;
const TAMANHO_PAGINA_PADRAO = 50;

export default function UsuariosPage() {
  const queryClient = useQueryClient();

  // Paginação server-side (MUI usa 0-indexed, API usa 1-indexed)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(TAMANHO_PAGINA_PADRAO);

  // Filtros — search é debounced antes de ir ao servidor
  const [search, setSearch] = useState('');
  const [searchAtivo, setSearchAtivo] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [filtroStatusCadastro, setFiltroStatusCadastro] = useState<
    'todos' | 'cadastrado' | 'Inativo' | 'bloqueado'
  >('todos');

  // Filtro de expiração aplicado localmente (cálculo de dias não vai ao servidor)
  const [filtroExpiracao, setFiltroExpiracao] = useState<FiltroExpiracao>('todos');

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');

  const [openNewUserModal, setOpenNewUserModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [initialData, setInitialData] = useState<Partial<Usuario> | undefined>(undefined);

  // Converte o filtro de status da UI para o parâmetro booleano da API.
  // 'bloqueado' não existe como filtro no backend — é aplicado localmente
  // via possuiLockout (ver filteredUsuarios abaixo).
  const ativoParam: boolean | null =
    filtroStatusCadastro === 'cadastrado' ? true :
    filtroStatusCadastro === 'Inativo' ? false :
    null;

  // Debounce do campo de busca — evita chamada a cada tecla
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchAtivo(search);
      setPage(0); // volta para a primeira página ao buscar
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Volta para a primeira página ao trocar o filtro de status
  useEffect(() => {
    setPage(0);
  }, [filtroStatusCadastro]);

  const usuariosQueryKey = ['usuarios', { page, rowsPerPage, searchAtivo, ativoParam }] as const;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: usuariosQueryKey,
    queryFn: () =>
      fetchUsuariosAdmin({
        pagina: page + 1, // API é 1-indexed
        tamanhoPagina: rowsPerPage,
        search: searchAtivo || undefined,
        ativo: ativoParam ?? undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  const usuarios = data?.itens ?? [];
  const totalItens = data?.totalItens ?? 0;
  const errorMessage = error instanceof Error ? error.message : 'Não foi possível carregar a lista de usuários.';

  const invalidateUsuarios = () => queryClient.invalidateQueries({ queryKey: ['usuarios'] });

  // Filtros de expiração e bloqueio — aplicados localmente na página atual
  const now = useMemo(() => new Date(), [data]);
  const filteredUsuarios = useMemo(() => {
    let resultado = usuarios;

    if (filtroStatusCadastro === 'bloqueado') {
      resultado = resultado.filter((user) => user.possuiLockout);
    }

    if (filtroExpiracao !== 'todos') {
      resultado = resultado.filter((user) => {
        if (!user.expirationDate) return false;
        const exp = new Date(user.expirationDate);
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (filtroExpiracao === 'expirado') return diffDays < 0;
        return diffDays >= 0 && diffDays <= Number(filtroExpiracao);
      });
    }

    return resultado;
  }, [usuarios, filtroExpiracao, filtroStatusCadastro, now]);

  // Stats baseados na página atual
  const usuariosAtivos = usuarios.filter((u) => u.ativo).length;
  const expirandoEm60 = usuarios.filter((u) => {
    if (!u.expirationDate) return false;
    const diff = Math.ceil((new Date(u.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 60;
  }).length;
  const expirados = usuarios.filter((u) => {
    if (!u.expirationDate) return false;
    return new Date(u.expirationDate) < now;
  }).length;
  const novosUltimos7Dias = usuarios.filter((u) => {
    if (!u.dataCadastro) return false;
    const diffDays = Math.ceil((now.getTime() - new Date(u.dataCadastro).getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  const statsCards: StatCardData[] = [
    {
      titulo: 'Total de Usuários',
      valor: totalItens.toLocaleString(),
      icone: <UsersThree size={32} weight="duotone" />,
      corFundoIcone: '#DBEAFE',
      corIcone: '#2563EB',
    },
    {
      titulo: 'Usuários Ativos (página)',
      valor: usuariosAtivos.toLocaleString(),
      variacao: `${usuarios.length > 0 ? Math.round((usuariosAtivos / usuarios.length) * 100) : 0}% desta página`,
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
    {
      titulo: 'Novos Cadastros (7 dias)',
      valor: novosUltimos7Dias.toLocaleString(),
      variacao: `${usuarios.length > 0 ? Math.round((novosUltimos7Dias / usuarios.length) * 100) : 0}% desta página`,
      icone: <UserPlus size={32} weight="duotone" />,
      corFundoIcone: '#EDE9FE',
      corIcone: '#7C3AED',
    },
  ];

  const handleExportar = (usuariosParaExportar: Usuario[]) => {
    const cabecalho = ['Nome', 'Email', 'Perfil', 'Status', 'Expira em', 'Cadastrado em', 'Embaixadora'];
    const linhas = usuariosParaExportar.map((u) => [
      u.nomeCompleto,
      u.email,
      u.roles?.[0] || u.perfil || 'Professor',
      u.possuiLockout ? 'Bloqueada' : u.statusConta || (u.ativo ? 'Ativa' : 'Inativo'),
      u.expirationDate ? new Date(u.expirationDate).toLocaleDateString('pt-BR') : '',
      u.dataCadastro ? new Date(u.dataCadastro).toLocaleDateString('pt-BR') : '',
      u.isEmbaixadora ? 'Sim' : 'Não',
    ]);

    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usuarios-plural-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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

  const indiceUsuarioSelecionado = selectedUsuario
    ? filteredUsuarios.findIndex((u) => u.idUsuario === selectedUsuario.idUsuario)
    : -1;
  const temAnterior = indiceUsuarioSelecionado > 0;
  const temProximo =
    indiceUsuarioSelecionado >= 0 && indiceUsuarioSelecionado < filteredUsuarios.length - 1;

  const handleAnterior = () => {
    if (temAnterior) handleVerPerfil(filteredUsuarios[indiceUsuarioSelecionado - 1]);
  };
  const handleProximo = () => {
    if (temProximo) handleVerPerfil(filteredUsuarios[indiceUsuarioSelecionado + 1]);
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'grey.50', minHeight: '100vh', pb: 8 }}>
      {/* Cards */}
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 3 }}>
        {isLoading ? (
          <LoadingState variant="cards" rows={3} />
        ) : isError ? (
          <ErrorState message={errorMessage} onRetry={() => refetch()} />
        ) : (
          <StatsGrid cards={statsCards} spacing={3} />
        )}
      </Box>

      <Box sx={{ px: { xs: 2, md: 4 }, pt: 2 }}>
        <Tabs
          value={filtroStatusCadastro}
          onChange={(_e, value) => setFiltroStatusCadastro(value)}
          sx={{
            minHeight: 40,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.secondary',
            },
            '& .Mui-selected': { color: 'primary.main' },
          }}
        >
          <Tab value="todos" label="Todos" />
          <Tab value="cadastrado" label="Ativos" />
          <Tab value="Inativo" label="Inativos" />
          <Tab value="bloqueado" label="Bloqueados" />
        </Tabs>
      </Box>

      <SearchFilterBar
        search={search}
        setSearch={setSearch}
        placeholder="Buscar por nome, e-mail ou telefone..."
        expirationFilter={filtroExpiracao}
        setExpirationFilter={setFiltroExpiracao}
      />

      <Box sx={{ px: { xs: 2, md: 4 } }}>
        <UsersListLayout
          filteredUsuarios={filteredUsuarios}
          loading={isLoading}
          error={isError ? errorMessage : null}
          totalCount={
            filtroExpiracao === 'todos' && filtroStatusCadastro !== 'bloqueado'
              ? totalItens
              : filteredUsuarios.length
          }
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(newPage) => setPage(newPage)}
          onRowsPerPageChange={(newSize) => { setRowsPerPage(newSize); setPage(0); }}
          onVerPerfil={handleVerPerfil}
          onExportar={handleExportar}
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
          await invalidateUsuarios();
        }}
        onError={(msg) => {
          setSnackMessage(msg);
          setSnackSeverity('error');
          setSnackOpen(true);
        }}
      />

      <ProfileUserAppEdit
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        userId={selectedUsuario?.idUsuario ?? 0}
        initialData={initialData}
        onProximo={handleProximo}
        onAnterior={handleAnterior}
        temProximo={temProximo}
        temAnterior={temAnterior}
        onSuccess={async () => {
          setSnackMessage('Perfil atualizado com sucesso!');
          setSnackSeverity('success');
          setSnackOpen(true);
          await invalidateUsuarios();
        }}
      />

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
