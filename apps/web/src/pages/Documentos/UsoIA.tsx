import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Sparkle, UsersThree, Warning, CheckCircle } from '@phosphor-icons/react'

import StatsGrid, { type StatCardData } from '../../components/StatsGrid'
import DistribuicaoCard from '../../components/dashboard/DistribuicaoCard'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import usoIAService, { type UsoIAPorProfessora } from '../../services/usoIAService'

const PERIODOS_DISPONIVEIS = [7, 30, 90] as const

const CORES_TIPO = ['#276678', '#A786B6', '#FFBE33', '#28a745']

function formatarData(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function UsoIA() {
  const [periodoDias, setPeriodoDias] = useState<number>(30)
  const [busca, setBusca] = useState('')

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
    const lista = data?.porProfessora ?? []
    if (!termo) return lista
    return lista.filter((p) => p.nomeCompleto.toLowerCase().includes(termo))
  }, [data, busca])

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

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Uso de IA
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Estudo de Caso, PAEE, Avaliação Diagnóstica e Relato de Atendimento — geração de texto por IA.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <StatsGrid cards={statsCards} spacing={3} />
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

      <Box sx={{ mb: 4 }}>
        <DistribuicaoCard
          titulo="Gerações por tipo de documento"
          total={data.totalGeracoes}
          itens={
            data.porTipoDocumento.length > 0
              ? data.porTipoDocumento.map((item, i) => ({
                  label: item.tipoDocumento,
                  valor: item.total,
                  color: CORES_TIPO[i % CORES_TIPO.length],
                }))
              : [{ label: 'Sem gerações no período', valor: 0 }]
          }
        />
      </Box>

      <Paper elevation={0} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Por professora
          </Typography>
          <TextField
            size="small"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            sx={{ minWidth: 240 }}
          />
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
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Falhas</TableCell>
                <TableCell>Última geração</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {professorasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      {data.porProfessora.length === 0
                        ? 'Nenhuma geração registrada no período selecionado.'
                        : 'Nenhuma professora encontrada para essa busca.'}
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
