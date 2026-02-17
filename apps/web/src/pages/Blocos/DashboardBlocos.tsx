'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Container, Typography } from '@mui/material';
import StatsGrid, { StatCardData } from '../../components/StatsGrid';
import SearchFilterBar from '../../components/SearchFilterBar';
import ListaBlocos from './ListaBlocos';
import { School, Book, CheckCircle } from '@mui/icons-material';

// Tipagem do filtro de status
type StatusFilter = 'todos' | 'ativos' | 'inativos';

const statusOptions = [
  { value: 'todos' as const, label: 'Todos os Status' },
  { value: 'ativos' as const, label: 'Ativos' },
  { value: 'inativos' as const, label: 'Inativos' },
];

export default function DashboardBlocos() {
  // Estados de filtro (serão usados tanto na busca quanto na tabela)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');

  // Dados de estatísticas (podem vir da API)
  const [stats, setStats] = useState({
    totalBlocos: 0,
    blocosAtivos: 0,
    totalAtividades: 0,
  });

const handleTotalChange = useCallback((total: number) => {
    setStats(prev => {
      // Só atualiza se o valor mudou (evita loop infinito)
      if (prev.totalBlocos === total) return prev;
      return { ...prev, totalBlocos: total };
    });
  }, []);

  // Cards de estatísticas
  const statCards: StatCardData[] = [
    {
      titulo: 'Total de Blocos',
      valor: stats.totalBlocos,
      variacao: '+3 este mês',
      icone: <School fontSize="large" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
    {
      titulo: 'Blocos Ativos',
      valor: stats.blocosAtivos,
      variacao: stats.totalBlocos > 0 
        ? `${((stats.blocosAtivos / stats.totalBlocos) * 100).toFixed(1)}% do total`
        : '0%',
      icone: <CheckCircle fontSize="large" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
    {
      titulo: 'Total de Atividades',
      valor: stats.totalAtividades,
      variacao: stats.totalBlocos > 0 
        ? `Média: ${(stats.totalAtividades / stats.totalBlocos).toFixed(1)} por bloco`
        : '0 por bloco',
      icone: <Book fontSize="large" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
  ];

  // Exemplo: carregar dados reais (futuro)
  useEffect(() => {
    // Aqui você pode fazer fetch para /api/blocos/stats
    // Por enquanto usando valores mock
   
  }, []);

  return (
    <Box sx={{ width: '100%', bgcolor: 'grey.50', pb: 8 }}>
      {/* 1. Cards de estatísticas */}
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 3 }}>
        <StatsGrid cards={statCards} spacing={3} />
      </Box>

      {/* 2. Barra de busca + filtros */}
      <SearchFilterBar<StatusFilter>
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusOptions={statusOptions}
        placeholder="Buscar por nome do bloco..."
      />

      {/* 3. Área da lista/tabela de blocos */}
      <Box sx={{ mt:  3, px: { xs: 2, md: 4 } }}>
        <ListaBlocos 
          search={search}              
          statusFilter={statusFilter}
          onTotalChange={handleTotalChange}
        />
      </Box>
    </Box>
  );
}