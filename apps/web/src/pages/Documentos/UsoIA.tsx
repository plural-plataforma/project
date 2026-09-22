import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Chip,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Sparkle,
  UsersThree,
  Warning,
  CheckCircle,
  Prohibit,
  Gauge,
  CurrencyCircleDollar,
  ChartBar,
} from '@phosphor-icons/react'

import StatsGrid, { type StatCardData } from '../../components/StatsGrid'
import DistribuicaoCard from '../../components/dashboard/DistribuicaoCard'
import BarrasCard, { type BarraItem } from '../../components/dashboard/BarrasCard'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import usoIAService, { type UsoIAPorDia, type UsoIAPorProfessora } from '../../services/usoIAService'

const PERIODOS_DISPONIVEIS = [7, 30, 90] as const

const CORES_TIPO = ['#276678', '#A786B6', '#FFBE33', '#28a745', '#E07A5F', '#3D5A80']
const CORES_FAIXA = ['#28a745', '#276678', '#FFBE33', '#dc3545']

function formatarData(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatarDiaMes(dataIso: string): string {
  const [, mes, dia] = dataIso.split('-')
  return `${dia}/${mes}`
}

function formatarReais(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function montarBarrasPorDia(porDia: UsoIAPorDia[]): BarraItem[] {
  // Rótulo a cada N dias pra série de 30/90 dias não virar uma faixa ilegível.
  const intervaloRotulo = Math.max(1, Math.ceil(porDia.length / 8))
  return porDia.map((dia, indice) => ({
    chave: dia.data,
    valor: dia.total,
    rotuloEixo: indice % intervaloRotulo === 0 ? formatarDiaMes(dia.data) : undefined,
    color: dia.bloqueiosLimite > 0 ? '#dc3545' : undefined,
    detalhe: (
      <Box>
        <strong>{formatarDiaMes(dia.data)}</strong>
        <br />
        {dia.total} gerações ({dia.sucesso} sucesso, {dia.falha} falha)
        <br />
        {dia.professorasDistintas} professora{dia.professorasDistintas !== 1 ? 's' : ''}
        {dia.bloqueiosLimite > 0 && (
          <>
            <br />
            {dia.bloqueiosLimite} bloqueio{dia.bloqueiosLimite !== 1 ? 's' : ''} pelo limite diário
          </>
        )}
      </Box>
    ),
  }))
}

export default function UsoIA() {
  const [periodoDias, setPeriodoDias] = useState<number>(30)
  const [busca, setBusca] = useState('')
  const [somenteNoLimiteMensal, setSomenteNoLimiteMensal] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['uso-ia', periodoDias],
    queryFn: () => {
      const to = new Date()
      const from = new Date()
      from.setDate(from.getDate() - periodoDias)
      return usoIAService.getUsoIA({ from, to })
    },
  })

  const professorasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    let lista = data?.porProfessora ?? []
    if (somenteNoLimiteMensal) lista = lista.filter((p) => p.limiteMensalAtingido)
    if (!termo) return lista
    return lista.filter((p) => p.nomeCompleto.toLowerCase().includes(termo))
  }, [data, busca, somenteNoLimiteMensal])

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, mx: 'auto' }}>
        <LoadingState variant="cards" rows={4} />
      </Box>
    )
  }

  if (isError || !data) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, mx: 'auto' }}>
        <ErrorState
          title="Não foi possível carregar o uso de IA"
          onRetry={() => refetch()}
        />
      </Box>
    )
  }

  const taxaSucesso = data.totalGeracoes > 0
    ? Math.round((data.totalSucesso / data.totalGeracoes) * 100)
    : 0

  const statsCards: StatCardData[] = [
    {
      titulo: `Gerações (${periodoDias} dias)`,
      valor: data.totalGeracoes.toLocaleString('pt-BR'),
      icone: <Sparkle size={32} weight="duotone" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
    {
      titulo: 'Taxa de sucesso',
      valor: `${taxaSucesso}%`,
      variacao: data.totalFalha > 0 ? `${data.totalFalha} falha${data.totalFalha !== 1 ? 's' : ''}` : 'Nenhuma falha',
      icone: <CheckCircle size={32} weight="duotone" />,
      corFundoIcone: 'rgba(40,167,69,0.08)',
      corIcone: '#28a745',
    },
    {
      titulo: 'Professoras ativas no período',
      valor: data.professorasAtivasNoPeriodo.toLocaleString('pt-BR'),
      variacao: `de ${data.totalProfessoras} no total`,
      icone: <UsersThree size={32} weight="duotone" />,
      corFundoIcone: 'rgba(167,134,182,0.12)',
      corIcone: '#A786B6',
    },
    {
      titulo: 'Nunca geraram nenhum documento',
      valor: data.professorasSemUsoNunca.toLocaleString('pt-BR'),
      icone: <Warning size={32} weight="duotone" />,
      corFundoIcone: 'rgba(255,190,51,0.12)',
      corIcone: '#B8860B',
    },
  ]

  const limitesCards: StatCardData[] = [
    {
      titulo: `No limite mensal (${data.limiteMensal}) este mês`,
      valor: data.professorasNoLimiteMensalMesAtual.toLocaleString('pt-BR'),
      variacao: 'Só aviso, sem bloqueio — revisar manualmente',
      icone: <Gauge size={32} weight="duotone" />,
      corFundoIcone: 'rgba(255,190,51,0.12)',
      corIcone: '#B8860B',
    },
    {
      titulo: `Bloqueios pelo limite diário (${data.limiteDiario})`,
      valor: data.totalBloqueiosLimite.toLocaleString('pt-BR'),
      variacao: `${data.professorasComBloqueioNoPeriodo} professora${data.professorasComBloqueioNoPeriodo !== 1 ? 's' : ''} no período`,
      icone: <Prohibit size={32} weight="duotone" />,
      corFundoIcone: 'rgba(220,53,69,0.08)',
      corIcone: '#dc3545',
    },
    {
      titulo: 'Gerações por professora ativa',
      valor: `${data.medianaGeracoesPorProfessoraAtiva} (mediana)`,
      variacao: `média ${data.mediaGeracoesPorProfessoraAtiva.toLocaleString('pt-BR')} · 90% até ${data.percentil90GeracoesPorProfessoraAtiva}`,
      icone: <ChartBar size={32} weight="duotone" />,
      corFundoIcone: 'rgba(39,102,120,0.08)',
      corIcone: '#276678',
    },
    {
      titulo: 'Custo estimado de IA',
      valor: formatarReais(data.custoEstimadoReais),
      variacao: 'Estimativa (~R$ 0,02 por geração)',
      icone: <CurrencyCircleDollar size={32} weight="duotone" />,
      corFundoIcone: 'rgba(40,167,69,0.08)',
      corIcone: '#28a745',
    },
  ]

  const barrasPorHora: BarraItem[] = data.porHora.map((h) => ({
    chave: String(h.hora),
    valor: h.total,
    rotuloEixo: h.hora % 3 === 0 ? `${h.hora}h` : undefined,
    detalhe: `${h.hora}h–${h.hora}h59: ${h.total} gerações`,
  }))

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Uso de IA
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Estudo de Caso, PAEE, Avaliação Diagnóstica, Relato de Atendimento e Relatório Pedagógico — geração de
          texto por IA. Limites por professora: {data.limiteDiario}/dia (bloqueia) e {data.limiteMensal}/mês (só
          aviso), contando gerações com sucesso no horário de Brasília.
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <StatsGrid cards={statsCards} spacing={3} />
      </Box>

      <Box sx={{ mb: 4 }}>
        <StatsGrid cards={limitesCards} spacing={3} />
      </Box>

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
          Período
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={periodoDias}
          exclusive
          onChange={(_event, novoValor) => {
            if (novoValor !== null) setPeriodoDias(novoValor)
          }}
        >
          {PERIODOS_DISPONIVEIS.map((dias) => (
            <ToggleButton key={dias} value={dias}>
              {dias} dias
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DistribuicaoCard
            titulo="Gerações por tipo de documento"
            total={data.totalGeracoes}
            itens={
              data.porTipoDocumento.length > 0
                ? data.porTipoDocumento.map((item, i) => ({
                    label: `${item.tipoDocumento} · ${item.professorasDistintas} prof.`,
                    valor: item.total,
                    color: CORES_TIPO[i % CORES_TIPO.length],
                  }))
                : [{ label: 'Sem gerações no período', valor: 0 }]
            }
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DistribuicaoCard
            titulo="Professoras por faixa de uso no período"
            total={data.professorasAtivasNoPeriodo}
            itens={data.faixasUso.map((faixa, i) => ({
              label: `${faixa.faixa} gerações`,
              valor: faixa.professoras,
              color: CORES_FAIXA[i % CORES_FAIXA.length],
            }))}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <BarrasCard
            titulo="Gerações por dia (vermelho: houve bloqueio)"
            itens={montarBarrasPorDia(data.porDia)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <BarrasCard titulo="Horário das gerações (Brasília)" itens={barrasPorHora} />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Por professora
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={somenteNoLimiteMensal}
                  onChange={(e) => setSomenteNoLimiteMensal(e.target.checked)}
                />
              }
              label={<Typography variant="body2">Só no limite mensal</Typography>}
            />
            <TextField
              size="small"
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              sx={{ minWidth: 240 }}
            />
          </Box>
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Professora</TableCell>
                <TableCell align="right">Estudo de Caso</TableCell>
                <TableCell align="right">PAEE</TableCell>
                <TableCell align="right">Aval. Diagnóstica</TableCell>
                <TableCell align="right">Relato</TableCell>
                <TableCell align="right">Relatório</TableCell>
                <TableCell align="right">Revisão final</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Falhas</TableCell>
                <TableCell align="right">
                  <Tooltip title="Tentativas recusadas pelo limite diário" arrow>
                    <span>Bloqueios</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Gerações com sucesso no mês corrente (horário de Brasília)" arrow>
                    <span>Mês atual</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">Dias ativos</TableCell>
                <TableCell align="right">
                  <Tooltip title="Maior número de gerações em um único dia do período" arrow>
                    <span>Máx./dia</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">Alunos</TableCell>
                <TableCell>Primeira geração</TableCell>
                <TableCell>Última geração</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {professorasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      {data.porProfessora.length === 0
                        ? 'Nenhuma geração registrada no período selecionado.'
                        : 'Nenhuma professora encontrada para esse filtro.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                professorasFiltradas.map((p: UsoIAPorProfessora) => (
                  <TableRow key={p.professorId} hover>
                    <TableCell>{p.nomeCompleto}</TableCell>
                    <TableCell align="right">{p.estudoCaso}</TableCell>
                    <TableCell align="right">{p.paee}</TableCell>
                    <TableCell align="right">{p.avaliacaoDiagnostica}</TableCell>
                    <TableCell align="right">{p.relatoAtendimento}</TableCell>
                    <TableCell align="right">{p.relatorioPedagogico}</TableCell>
                    <TableCell align="right">{p.relatorioTextoFinal}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>
                        {p.total}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {p.total - p.sucesso > 0 ? (
                        <Chip label={p.total - p.sucesso} size="small" color="warning" variant="outlined" />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {p.bloqueiosLimite > 0 ? (
                        <Chip label={p.bloqueiosLimite} size="small" color="error" variant="outlined" />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {p.limiteMensalAtingido ? (
                        <Chip label={`${p.usoMesAtual}/${data.limiteMensal}`} size="small" color="warning" />
                      ) : (
                        p.usoMesAtual
                      )}
                    </TableCell>
                    <TableCell align="right">{p.diasAtivos}</TableCell>
                    <TableCell align="right">
                      {p.maximoEmUmDia >= data.limiteDiario ? (
                        <Chip label={p.maximoEmUmDia} size="small" color="error" variant="outlined" />
                      ) : (
                        p.maximoEmUmDia
                      )}
                    </TableCell>
                    <TableCell align="right">{p.alunosDistintos}</TableCell>
                    <TableCell>{formatarData(p.primeiraGeracao)}</TableCell>
                    <TableCell>{formatarData(p.ultimaGeracao)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}
