'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box } from '@mui/material';
import SearchFilterBar from '../../components/SearchFilterBar';
import StatsGrid, { type StatCardData } from '../../components/StatsGrid';
import ListaAtividades from './ListaAtividades';
import atividadesService from '../../services/atividadesService';
import { Book, CheckCircle } from '@mui/icons-material';

type StatusFilter = 'todos' | 'ativo' | 'inativo';

const statusOptions = [
  { value: 'todos' as const, label: 'Todos os Status' },
  { value: 'ativo' as const, label: 'Ativo' },
  { value: 'inativo' as const, label: 'Inativo' },
];

export default function DashboardAtividades() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');

  const ativo = statusFilter === 'todos' ? undefined : statusFilter === 'ativo';

  // Busca uma amostra ampla para calcular estatísticas reais, já que o backend
  // não expõe um endpoint de agregação dedicado (ver observações do plano).
  const { data: atividades = [] } = useQuery({
    queryKey: ['atividades-stats', { search, statusFilter }],
    queryFn: () =>
      atividadesService.getAtividades({
        busca: search.trim() || undefined,
        ativo,
        page: 1,
        pageSize: 1000,
      }),
  });

  const totalAtividades = atividades.length;
  const atividadesAtivas = atividades.filter((a) => a.ativo).length;

  const statCards: StatCardData[] = [
    {
      titulo: 'Atividades Ativas',
      valor: atividadesAtivas,
      variacao: totalAtividades > 0 ? `${((atividadesAtivas / totalAtividades) * 100).toFixed(1)}% do total` : '0%',
      icone: <CheckCircle fontSize="large" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
    {
      titulo: 'Total de Atividades',
      valor: totalAtividades,
      icone: <Book fontSize="large" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
  ];

  return (
    <Box sx={{ width: '100%', bgcolor: 'grey.50', pb: 8 }}>
      {/* Cards de estatística */}
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 3 }}>
        <StatsGrid cards={statCards} spacing={3} />
      </Box>

      {/* Barra de busca + filtros */}
      <SearchFilterBar<StatusFilter>
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusOptions={statusOptions}
        placeholder="Buscar por nome da atividade..."
      />

      {/* Lista de atividades */}
      <Box sx={{ mt: 3, px: { xs: 2, md: 4 } }}>
        <ListaAtividades search={search} statusFilter={statusFilter} />
      </Box>
    </Box>
  );
}
