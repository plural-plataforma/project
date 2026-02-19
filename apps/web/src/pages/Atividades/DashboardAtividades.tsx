'use client';

import { useState } from 'react';
import { Box, Container } from '@mui/material';
import SearchFilterBar from '../../components/SearchFilterBar';
import StatsGrid, { StatCardData } from '../../components/StatsGrid';
import ListaAtividades from './ListaAtividades';
import { School, Book, CheckCircle } from '@mui/icons-material';

// Tipagem para filtro de status (igual ao de blocos)
type StatusFilter = 'todos' | 'ativo' | 'inativo';

const statusOptions = [
  { value: 'todos' as const, label: 'Todos os Status' },
  { value: 'ativo' as const, label: 'Ativo' },
  { value: 'inativo' as const, label: 'Inativo' },
];

export default function DashboardAtividades() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');

  // Estatísticas mock (substitua por dados reais da API depois)
  const statCards: StatCardData[] = [
    {
      titulo: 'Blocos Ativos',
      valor: 21,
      variacao: '87.5% do total',
      icone: <School fontSize="large" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
    {
      titulo: 'Total de Atividades',
      valor: 342,
      variacao: 'Média: 14.2 por bloco',
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
      <Box sx={{ mt:  3, px: { xs: 2, md: 4 } }}>
        <ListaAtividades search={search} statusFilter={statusFilter} />
      </Box>
    </Box>
  );
}