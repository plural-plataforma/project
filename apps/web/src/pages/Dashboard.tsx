// pages/Dashboard.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { People, Psychology, School, Assignment } from '@mui/icons-material';

import StatsGrid, { type StatCardData } from '../components/StatsGrid';
import DistribuicaoCard from '../components/dashboard/DistribuicaoCard';
import ListaRecente from '../components/dashboard/ListaRecente';
import { fetchUsuariosAdmin } from '../services/adminService';
import habilidadesService from '../services/habilidadesService';
import blocosService from '../services/blocosService';
import atividadesService from '../services/atividadesService';
import hotmartService from '../services/hotmartService';
import dashboardService from '../services/dashboardService';
import { blocosQueryKey } from './Blocos/ListaBlocos';

const PERIODOS_DISPONIVEIS = [7, 30, 90] as const;

const NIVEL_REALIZACAO_LABELS: Record<string, string> = {
  Autonomia: 'Autonomia',
  ComAjuda: 'Com Ajuda',
  NaoRealizou: 'Não Realizou',
  NaoAvaliado: 'Não Avaliado',
};

const NIVEL_REALIZACAO_CORES: Record<string, string> = {
  Autonomia: '#28a745',
  ComAjuda: '#FFBE33',
  NaoRealizou: '#FF0000',
  NaoAvaliado: '#9CA3AF',
};

/**
 * Estatísticas reais, reaproveitando os mesmos endpoints já usados nas telas
 * de listagem (usuários, habilidades, blocos e atividades). Não existe
 * endpoint de agregação/dashboard no backend — ver observações do plano.
 */
export default function Dashboard() {
  const [periodoDias, setPeriodoDias] = useState<number>(30);

  const { data: usuariosTotal } = useQuery({
    queryKey: ['usuarios-stats', 'total'],
    queryFn: () => fetchUsuariosAdmin({ pagina: 1, tamanhoPagina: 1 }),
  });

  const { data: usuariosAtivos } = useQuery({
    queryKey: ['usuarios-stats', 'ativos'],
    queryFn: () => fetchUsuariosAdmin({ pagina: 1, tamanhoPagina: 1, ativo: true }),
  });

  const { data: usuariosEmbaixadoras } = useQuery({
    queryKey: ['usuarios-stats', 'embaixadoras'],
    queryFn: () => fetchUsuariosAdmin({ pagina: 1, tamanhoPagina: 1, isEmbaixadora: true }),
  });

  const { data: habilidades = [] } = useQuery({
    queryKey: ['habilidades'],
    queryFn: () => habilidadesService.getAllHabilidades(),
  });

  // Todos os blocos (não só ativos) — mesma queryKey/queryFn de DashboardBlocos
  // com filtro "todos", garantindo cache compartilhado entre as telas.
  const { data: blocos = [] } = useQuery({
    queryKey: blocosQueryKey('', 'todos'),
    queryFn: () => blocosService.getBlocosCompleto({}),
  });

  const { data: atividades = [] } = useQuery({
    queryKey: ['atividades-stats', { search: '', statusFilter: 'todos' }],
    queryFn: () => atividadesService.getAtividades({ page: 1, pageSize: 1000 }),
  });

  const {
    data: vendasHotmart,
    isError: vendasHotmartComErro,
  } = useQuery({
    queryKey: ['vendas-hotmart', periodoDias],
    queryFn: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - periodoDias);
      return hotmartService.getVendasComStatusCadastro({ from, to });
    },
    retry: 0,
  });

  const {
    data: resumoPedagogico,
    isError: resumoPedagogicoComErro,
  } = useQuery({
    queryKey: ['resumo-pedagogico', periodoDias],
    queryFn: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - periodoDias);
      return dashboardService.getResumoPedagogico({ from, to });
    },
    retry: 0,
  });

  const totalUsuarios = usuariosTotal?.totalItens ?? 0;
  const totalUsuariosAtivos = usuariosAtivos?.totalItens ?? 0;
  const totalUsuariosInativos = Math.max(0, totalUsuarios - totalUsuariosAtivos);
  const totalEmbaixadoras = usuariosEmbaixadoras?.totalItens ?? 0;

  const habilidadesAtivas = habilidades.filter((h) => h.ativo).length;
  const habilidadesInativas = habilidades.length - habilidadesAtivas;

  const totalBlocos = blocos.length;
  const blocosAtivos = blocos.filter((b) => b.status).length;
  const blocosInativos = totalBlocos - blocosAtivos;

  const totalAtividades = atividades.length;
  const atividadesPorNivel = ['Facil', 'Medio', 'Dificil'].map((nivel) => ({
    label: nivel === 'Facil' ? 'Fácil' : nivel === 'Medio' ? 'Médio' : 'Difícil',
    valor: atividades.filter((a) => a.nivel === nivel).length,
  }));

  const ultimosBlocos = [...blocos]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((bloco) => ({
      id: bloco.id,
      primary: bloco.titulo,
      secondary: `Cadastrado em ${new Date(bloco.createdAt).toLocaleDateString('pt-BR')}`,
      chipLabel: bloco.status ? 'Ativo' : 'Inativo',
      chipColor: bloco.status ? ('success' as const) : ('default' as const),
    }));

  const desempenhosPorNivelItens = (resumoPedagogico?.desempenhosPorNivel ?? []).map((item) => ({
    label: NIVEL_REALIZACAO_LABELS[item.nivel] ?? item.nivel,
    valor: item.quantidade,
    color: NIVEL_REALIZACAO_CORES[item.nivel],
  }));

  const atividadesRecentes = [...atividades]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((atividade) => ({
      id: atividade.id,
      primary: atividade.titulo,
      secondary: `Cadastrada em ${new Date(atividade.createdAt).toLocaleDateString('pt-BR')}`,
      chipLabel: atividade.ativo ? 'Ativa' : 'Inativa',
      chipColor: atividade.ativo ? ('success' as const) : ('default' as const),
    }));

  const statsCards: StatCardData[] = [
    {
      titulo: 'Total Usuários',
      valor: totalUsuarios.toLocaleString('pt-BR'),
      icone: <People fontSize="large" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
    {
      titulo: 'Habilidades Ativas',
      valor: habilidadesAtivas.toLocaleString('pt-BR'),
      icone: <Psychology fontSize="large" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
    {
      titulo: 'Blocos Cadastrados',
      valor: totalBlocos.toLocaleString('pt-BR'),
      icone: <School fontSize="large" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
    {
      titulo: 'Atividades Cadastradas',
      valor: totalAtividades.toLocaleString('pt-BR'),
      icone: <Assignment fontSize="large" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, mx: 'auto' }}>
      {/* Cards de Estatísticas principais */}
      <Box sx={{ mb: 4 }}>
        <StatsGrid cards={statsCards} spacing={3} />
      </Box>

      {/* Seletor de período — alimenta as métricas de uso da plataforma e vendas Hotmart */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Período das métricas de uso da plataforma e vendas Hotmart
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={periodoDias}
          exclusive
          onChange={(_event, novoValor) => {
            if (novoValor !== null) setPeriodoDias(novoValor);
          }}
        >
          {PERIODOS_DISPONIVEIS.map((dias) => (
            <ToggleButton key={dias} value={dias}>
              {dias} dias
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Breakdowns */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DistribuicaoCard
            titulo="Usuários"
            total={totalUsuarios}
            itens={[
              { label: 'Ativos', valor: totalUsuariosAtivos, color: '#28a745' },
              { label: 'Inativos', valor: totalUsuariosInativos, color: '#9CA3AF' },
              { label: 'Embaixadoras', valor: totalEmbaixadoras, color: '#8B7BAB' },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DistribuicaoCard
            titulo="Atividades por Nível"
            total={totalAtividades}
            itens={atividadesPorNivel.map((item, i) => ({
              ...item,
              color: ['#28a745', '#FFBE33', '#FF0000'][i],
            }))}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DistribuicaoCard
            titulo="Habilidades"
            total={habilidades.length}
            itens={[
              { label: 'Ativas', valor: habilidadesAtivas, color: '#28a745' },
              { label: 'Inativas', valor: habilidadesInativas, color: '#9CA3AF' },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DistribuicaoCard
            titulo="Blocos"
            total={totalBlocos}
            itens={[
              { label: 'Ativos', valor: blocosAtivos, color: '#28a745' },
              { label: 'Inativos', valor: blocosInativos, color: '#9CA3AF' },
            ]}
          />
        </Grid>

        {!vendasHotmartComErro && vendasHotmart && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DistribuicaoCard
              titulo={`Vendas Hotmart (${periodoDias} dias)`}
              total={vendasHotmart.total}
              itens={[
                { label: 'Já cadastrados', valor: vendasHotmart.cadastrados, color: '#28a745' },
                { label: 'Ainda não cadastrados', valor: vendasHotmart.naoCadastrados, color: '#FFBE33' },
              ]}
            />
          </Grid>
        )}
      </Grid>

      {/* Uso da plataforma (avaliações, desempenhos e diagnósticos finais) */}
      {!resumoPedagogicoComErro && resumoPedagogico && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={0} sx={{ p: 3, height: '100%' }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ letterSpacing: '0.4px', textTransform: 'uppercase', mb: 2 }}
              >
                {`Uso da plataforma (${periodoDias} dias)`}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Avaliações diagnósticas criadas
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    {resumoPedagogico.avaliacoesCriadas.toLocaleString('pt-BR')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Avaliações concluídas
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    {resumoPedagogico.avaliacoesConcluidas.toLocaleString('pt-BR')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Desempenhos registrados
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    {resumoPedagogico.desempenhosRegistrados.toLocaleString('pt-BR')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Diagnósticos finais gerados
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    {resumoPedagogico.diagnosticosFinaisGerados.toLocaleString('pt-BR')}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <DistribuicaoCard
              titulo="Desempenhos por Nível de Realização"
              total={resumoPedagogico.desempenhosRegistrados}
              itens={
                desempenhosPorNivelItens.length > 0
                  ? desempenhosPorNivelItens
                  : [{ label: 'Sem registros no período', valor: 0 }]
              }
            />
          </Grid>
        </Grid>
      )}

      {/* Cadastros recentes */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ListaRecente
            titulo="Últimos blocos cadastrados"
            itens={ultimosBlocos}
            emptyMessage="Nenhum bloco cadastrado ainda."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ListaRecente
            titulo="Atividades recentes"
            itens={atividadesRecentes}
            emptyMessage="Nenhuma atividade cadastrada ainda."
          />
        </Grid>
      </Grid>
    </Box>
  );
}
