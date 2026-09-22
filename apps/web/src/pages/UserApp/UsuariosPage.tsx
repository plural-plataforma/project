// pages/UserApp/UsuariosPage.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Typography,
  Grid,
} from '@mui/material';

import SearchFilterBar, { type FiltroExpiracao } from '../../components/SearchFilterBar';
import { UsersListLayout } from '../../components/layouts/UsersListLayout';
import ProfileUserAppEdit from './ProfileUserApp';
import type { Usuario } from '../../types/userTypes';
import StatsGrid, { type StatCardData } from '../../components/StatsGrid';
import DistribuicaoCard from '../../components/dashboard/DistribuicaoCard';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

import { UsersThree, UserCheck, Star, Infinity as InfinityIcon } from '@phosphor-icons/react';

import { fetchUsuariosAdmin, fetchEstatisticasUsuarios } from '../../services/adminService';
import NewUserDialog from '../../components/dialogs/NewUserDialog';

const CORES_NIVEL_ENSINO = ['#2563EB', '#16A34A', '#DB2777', '#9333EA', '#EA580C', '#0D9488'];
const CORES_STATUS: Record<string, string> = {
  Ativa: '#16A34A',
  Bloqueada: '#DC2626',
  Expirada: '#E65100',
  Inativa: '#6B7280',
};

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

  // Filtros liga/desliga que vão ao servidor (para o export "tudo" bater com o filtro)
  const [filtroEmbaixadora, setFiltroEmbaixadora] = useState(false);
  const [filtroSemExpiracao, setFiltroSemExpiracao] = useState(false);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');

  const [openNewUserModal, setOpenNewUserModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [initialData, setInitialData] = useState<Partial<Usuario> | undefined>(undefined);
  const [exportando, setExportando] = useState(false);

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
  }, [filtroStatusCadastro, filtroEmbaixadora, filtroSemExpiracao]);

  const usuariosQueryKey = [
    'usuarios',
    { page, rowsPerPage, searchAtivo, ativoParam, filtroEmbaixadora, filtroSemExpiracao },
  ] as const;

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
        isEmbaixadora: filtroEmbaixadora ? true : undefined,
        semDataExpiracao: filtroSemExpiracao ? true : undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  const {
    data: estatisticas,
    isLoading: isLoadingEstatisticas,
    isError: isErrorEstatisticas,
    error: errorEstatisticas,
    refetch: refetchEstatisticas,
  } = useQuery({
    queryKey: ['usuarios-estatisticas'],
    queryFn: fetchEstatisticasUsuarios,
  });

  const usuarios = data?.itens ?? [];
  const totalItens = data?.totalItens ?? 0;
  const errorMessage = error instanceof Error ? error.message : 'Não foi possível carregar a lista de usuários.';
  const errorMessageEstatisticas =
    errorEstatisticas instanceof Error ? errorEstatisticas.message : 'Não foi possível carregar as estatísticas.';

  const invalidateUsuarios = () => {
    queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    queryClient.invalidateQueries({ queryKey: ['usuarios-estatisticas'] });
  };

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

  // Cards de estatística — visão geral (todo o cadastro), não só a página carregada
  const statsCards: StatCardData[] = [
    {
      titulo: 'Total de Usuários',
      valor: (estatisticas?.totalUsuarios ?? 0).toLocaleString('pt-BR'),
      icone: <UsersThree size={32} weight="duotone" />,
      corFundoIcone: '#DBEAFE',
      corIcone: '#2563EB',
    },
    {
      titulo: 'Usuários Ativos',
      valor: (estatisticas?.totalAtivos ?? 0).toLocaleString('pt-BR'),
      variacao: estatisticas && estatisticas.totalUsuarios > 0
        ? `${Math.round((estatisticas.totalAtivos / estatisticas.totalUsuarios) * 100)}% do total`
        : undefined,
      icone: <UserCheck size={32} weight="duotone" />,
      corFundoIcone: '#DCFCE7',
      corIcone: '#16A34A',
    },
    {
      titulo: 'Embaixadoras',
      valor: (estatisticas?.totalEmbaixadoras ?? 0).toLocaleString('pt-BR'),
      icone: <Star size={32} weight="duotone" />,
      corFundoIcone: '#EDE9FE',
      corIcone: '#7C3AED',
    },
    {
      titulo: 'Sem Data de Expiração',
      valor: (estatisticas?.totalSemExpiracao ?? 0).toLocaleString('pt-BR'),
      icone: <InfinityIcon size={32} weight="duotone" />,
      corFundoIcone: '#FFF3E0',
      corIcone: '#E65100',
    },
  ];

  const distribuicaoPorNivelEnsino = (estatisticas?.distribuicaoPorNivelEnsino ?? []).map((item, index) => ({
    label: item.chave,
    valor: item.valor,
    color: CORES_NIVEL_ENSINO[index % CORES_NIVEL_ENSINO.length],
  }));

  const distribuicaoPorStatus = (estatisticas?.distribuicaoPorStatus ?? []).map((item) => ({
    label: item.chave,
    valor: item.valor,
    color: CORES_STATUS[item.chave] ?? '#6B7280',
  }));

  const gerarCsv = (usuariosParaExportar: Usuario[]) => {
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

  const handleExportar = (usuariosParaExportar: Usuario[]) => gerarCsv(usuariosParaExportar);

  // Exporta todo o resultado do filtro atual (todas as páginas), não só a
  // página exibida — busca sequencialmente até esgotar totalPaginas.
  const handleExportarTudo = async () => {
    setExportando(true);
    try {
      const tamanho = 200;
      let paginaAtual = 1;
      let totalPaginasResposta = 1;
      let todosUsuarios: Usuario[] = [];

      do {
        const resposta = await fetchUsuariosAdmin({
          pagina: paginaAtual,
          tamanhoPagina: tamanho,
          search: searchAtivo || undefined,
          ativo: ativoParam ?? undefined,
          isEmbaixadora: filtroEmbaixadora ? true : undefined,
          semDataExpiracao: filtroSemExpiracao ? true : undefined,
        });
        todosUsuarios = todosUsuarios.concat(resposta.itens);
        totalPaginasResposta = resposta.totalPaginas;
        paginaAtual += 1;
      } while (paginaAtual <= totalPaginasResposta);

      gerarCsv(todosUsuarios);
    } catch (erroExportacao) {
      setSnackMessage(
        erroExportacao instanceof Error ? erroExportacao.message : 'Erro ao exportar usuários.'
      );
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setExportando(false);
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
      {/* Cabeçalho */}
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 4, pb: 1, maxWidth: 1440, mx: 'auto' }}>
        <Typography variant="h5" fontWeight={700}>
          Usuários
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Gerencie cadastros, acompanhe expiração de acesso e o quadro de embaixadoras.
        </Typography>
      </Box>

      {/* Cards */}
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 2, maxWidth: 1440, mx: 'auto' }}>
        {isLoadingEstatisticas ? (
          <LoadingState variant="cards" rows={4} />
        ) : isErrorEstatisticas ? (
          <ErrorState message={errorMessageEstatisticas} onRetry={() => refetchEstatisticas()} />
        ) : (
          <StatsGrid cards={statsCards} spacing={3} />
        )}
      </Box>

      {/* Distribuição */}
      {!isLoadingEstatisticas && !isErrorEstatisticas && (
        <Box sx={{ px: { xs: 2, md: 4 }, pt: 3, maxWidth: 1440, mx: 'auto' }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <DistribuicaoCard titulo="Distribuição por Nível de Ensino" itens={distribuicaoPorNivelEnsino} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DistribuicaoCard titulo="Distribuição por Status de Conta" itens={distribuicaoPorStatus} />
            </Grid>
          </Grid>
        </Box>
      )}

      <Box sx={{ px: { xs: 2, md: 4 }, pt: 3 }}>
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
        toggleFiltros={[
          {
            key: 'embaixadora',
            label: 'Só embaixadoras',
            active: filtroEmbaixadora,
            onToggle: () => setFiltroEmbaixadora((v) => !v),
          },
          {
            key: 'semExpiracao',
            label: 'Sem data de expiração',
            active: filtroSemExpiracao,
            onToggle: () => setFiltroSemExpiracao((v) => !v),
          },
        ]}
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
          onExportarTudo={handleExportarTudo}
          exportando={exportando}
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
