// pages/Dashboard.tsx
import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

import StatsGrid, { StatCardData } from '../components/StatsGrid'
import SearchFilterBar from '../components/SearchFilterBar';
import { Brain, CheckCircleIcon, Database, User } from '@phosphor-icons/react';

// Dados mock (substitua por API real depois)
const statsCards: StatCardData[] = [
  {
    titulo: 'Total Usuários',
    valor: '2.847',
    variacao: '+12% este mês',
    icone: <User size={20} weight="bold" />,
    corFundoIcone: '#E8F5E9',
    corIcone: '#4CAF50',
  },
  {
    titulo: 'Habilidades Ativas',
    valor: '156',
    variacao: '+3 esta semana',
    icone: <Brain size={20} weight="bold" />,
    corFundoIcone: '#F3E5F5',
    corIcone: '#9C27B0',
  },
  {
    titulo: 'Avaliações Realizadas',
    valor: '1.234',
    variacao: '+8% esta semana',
    icone: <CheckCircleIcon size={20} weight="bold"/>,
    corFundoIcone: '#E3F2FD',
    corIcone: '#2196F3',
  },
  {
    titulo: 'Atividades Cadastradas',
    valor: '892',
    variacao: '+15 esta semana',
    icone: <Database size={20} weight="bold" />,
    corFundoIcone: '#FFF3E0',
    corIcone: '#FF9800',
  },
];

const users = [
  { name: 'João Silva', role: 'Professor', status: 'Ativo', avatar: 'https://i.pravatar.cc/48?u=joao' },
  { name: 'Maria Santos', role: 'Coordenadora', status: 'Ativo', avatar: 'https://i.pravatar.cc/48?u=maria' },
  { name: 'Pedro Costa', role: 'Aluno', status: 'Inativo', avatar: 'https://i.pravatar.cc/48?u=pedro' },
];

const skills = [
  { name: 'Leitura e Interpretação', info: 'Português - 5º ano', status: 'Ativa' },
  { name: 'Operações Básicas', info: 'Matemática - 4º ano', status: 'Ativa' },
  { name: 'Resolução de Problemas', info: 'Matemática - 6º ano', status: 'Revisão' },
];

const blocks = [
  { title: 'Bloco Fundamental I', questions: 12, desc: 'Avaliação para 1º ao 5º ano', updated: '15/01/2024' },
  { title: 'Bloco Fundamental II', questions: 18, desc: 'Avaliação para 6º ao 9º ano', updated: '10/01/2024' },
];

const activities = [
  { title: 'Interpretação de Texto', subject: 'Português', desc: 'Múltipla escolha', difficulty: 'Médio' },
  { title: 'Equações do 1º Grau', subject: 'Matemática', desc: 'Resolução prática', difficulty: 'Fácil' },
];

export default function Dashboard() {
  // Estados de filtro (exemplo - você pode integrar com SearchFilterBar real)
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'todos' | 'ativo' | 'inativo'>('todos');

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, mx: 'auto' }}>
      {/* Cards de Estatísticas */}
      <Box sx={{ mb: 6 }}>
        <StatsGrid cards={statsCards} spacing={3} />
      </Box>

   </Box>
  );
}