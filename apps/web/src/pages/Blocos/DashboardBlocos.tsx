'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box } from '@mui/material';
import StatsGrid, { type StatCardData } from '../../components/StatsGrid';
import SearchFilterBar from '../../components/SearchFilterBar';
import ListaBlocos, { blocosQueryKey } from './ListaBlocos';
import blocosService from '../../services/blocosService';
import { School, Book, CheckCircle } from '@mui/icons-material';

type StatusFilter = 'todos' | 'ativos' | 'inativos';

const statusOptions = [
  { value: 'todos' as const, label: 'Todos os Status' },
  { value: 'ativos' as const, label: 'Ativos' },
  { value: 'inativos' as const, label: 'Inativos' },
];

export default function DashboardBlocos() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');

  const ativo = statusFilter === 'todos' ? undefined : statusFilter === 'ativos' ? true : false;

  // Mesma queryKey/queryFn usada por ListaBlocos: o TanStack Query deduplica
  // a requisição e compartilha o cache entre os dois componentes.
  const { data: blocos = [] } = useQuery({
    queryKey: blocosQueryKey(search, statusFilter),
    queryFn: () => blocosService.getBlocosCompleto({ busca: search.trim() || undefined, status: ativo }),
  });

  const totalBlocos = blocos.length;
  const blocosAtivos = blocos.filter((b) => b.status).length;
  const totalAtividades = blocos.reduce((acc, b) => acc + (b.quantidadeAtividades ?? 0), 0);

  const statCards: StatCardData[] = [
    {
      titulo: 'Total de Blocos',
      valor: totalBlocos,
      icone: <School fontSize="large" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
    {
      titulo: 'Blocos Ativos',
      valor: blocosAtivos,
      variacao: totalBlocos > 0 ? `${((blocosAtivos / totalBlocos) * 100).toFixed(1)}% do total` : '0%',
      icone: <CheckCircle fontSize="large" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
    {
      titulo: 'Total de Atividades',
      valor: totalAtividades,
      variacao: totalBlocos > 0 ? `Média: ${(totalAtividades / totalBlocos).toFixed(1)} por bloco` : '0 por bloco',
      icone: <Book fontSize="large" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
  ];

  return (
    <Box sx={{ width: '100%', bgcolor: 'grey.50', pb: 8 }}>
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 3 }}>
        <StatsGrid cards={statCards} spacing={3} />
      </Box>

      <SearchFilterBar<StatusFilter>
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusOptions={statusOptions}
        placeholder="Buscar por nome do bloco..."
      />

      <Box sx={{ mt: 3, px: { xs: 2, md: 4 } }}>
        <ListaBlocos search={search} statusFilter={statusFilter} />
      </Box>
    </Box>
  );
}
