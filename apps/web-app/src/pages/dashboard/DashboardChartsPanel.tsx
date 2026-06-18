import { motion } from 'framer-motion'
import { ChartBar, ChartDonut, ChartLineUp, Path } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DashboardBarPoint, DashboardChartSlice, DashboardCharts } from '@/lib/dashboardInsights'
import { formatMesCurto } from '@/lib/dashboardInsights'

function totalSlices(slices: DashboardChartSlice[]): number {
  return slices.reduce((acc, s) => acc + s.value, 0)
}

function conicGradientFromSlices(slices: DashboardChartSlice[]): string {
  const total = totalSlices(slices)
  if (total === 0) return `conic-gradient(${slices[0]?.color ?? '#cbd5e1'} 0 100%)`

  let acc = 0
  const partes: string[] = []
  for (const s of slices) {
    if (s.value <= 0) continue
    const start = (acc / total) * 100
    acc += s.value
    const end = (acc / total) * 100
    partes.push(`${s.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`)
  }
  return `conic-gradient(${partes.join(', ')})`
}

function DonutChart({
  slices,
  size = 128,
  centerLabel,
  centerSub,
}: {
  slices: DashboardChartSlice[]
  size?: number
  centerLabel: string
  centerSub?: string
}) {
  const total = totalSlices(slices)
  const hole = Math.round(size * 0.62)

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <div
          className="rounded-full shadow-inner transition-all duration-700"
          style={{
            width: size,
            height: size,
            background: total > 0 ? conicGradientFromSlices(slices) : '#e2e8f0',
          }}
          role="img"
          aria-label={`Gráfico: ${centerLabel}`}
        />
        <div
          className="absolute inset-0 m-auto rounded-full bg-card flex flex-col items-center justify-center text-center px-2"
          style={{ width: hole, height: hole }}
        >
          <span className="text-xl font-black text-foreground tabular-nums leading-none">{centerLabel}</span>
          {centerSub && <span className="text-[10px] text-muted-foreground mt-0.5">{centerSub}</span>}
        </div>
      </div>
      <ul className="flex-1 space-y-2 w-full min-w-[140px]">
        {slices.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-muted-foreground truncate">{s.label}</span>
            </span>
            <span className="font-bold text-foreground tabular-nums shrink-0">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function VerticalBarChart({ points, accent = '#276678' }: { points: DashboardBarPoint[]; accent?: string }) {
  const max = Math.max(...points.map((p) => p.value), 1)

  return (
    <div className="flex items-end justify-between gap-2 h-36" role="img" aria-label="Gráfico de barras">
      {points.map((p, i) => (
        <div key={`${p.label}-${i}`} className="flex-1 flex flex-col items-center gap-1.5 min-w-0 h-full">
          <span className="text-[10px] font-bold text-foreground tabular-nums h-4">
            {p.value > 0 ? p.value : ''}
          </span>
          <div className="flex-1 w-full max-w-10 flex flex-col justify-end">
            <motion.div
              className="w-full rounded-t-lg"
              style={{ backgroundColor: accent }}
              initial={{ height: 0 }}
              animate={{
                height: p.value > 0 ? `${Math.max((p.value / max) * 100, 12)}%` : 0,
              }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground text-center leading-tight truncate w-full">
            {p.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function HorizontalBarChart({ points }: { points: DashboardBarPoint[] }) {
  const max = Math.max(...points.map((p) => p.value), 1)
  const colors = ['#276678', '#8B7BAB', '#FFBE33', '#28a745', '#64748b']

  return (
    <ul className="space-y-3" role="img" aria-label="Gráfico horizontal">
      {points.map((p, i) => (
        <li key={p.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground font-medium">{p.label}</span>
            <span className="font-bold text-foreground tabular-nums">{p.value}</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
              initial={{ width: 0 }}
              animate={{ width: `${(p.value / max) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function JornadaRadarBars({ steps }: { steps: DashboardCharts['jornadaProgresso'] }) {
  return (
    <ul className="space-y-2.5">
      {steps.map((step, i) => (
        <li key={step.id}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">{step.label}</span>
            <span className={cn('font-semibold tabular-nums', step.percent === 100 ? 'text-success' : 'text-muted-foreground')}>
              {step.percent === 100 ? '✓' : '—'}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', step.percent === 100 ? 'bg-success' : 'bg-primary/30')}
              initial={{ width: 0 }}
              animate={{ width: `${step.percent}%` }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export interface DashboardChartsPanelProps {
  charts: DashboardCharts
  coberturaPercent: number
  presencaMesPercent: number | null
  totalAlunos: number
}

export function DashboardChartsPanel({
  charts,
  coberturaPercent,
  presencaMesPercent,
  totalAlunos,
}: DashboardChartsPanelProps) {
  const mes = formatMesCurto()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="grid md:grid-cols-2 gap-4"
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ChartBar size={18} className="text-primary" weight="duotone" />
            Atendimentos por semana
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <VerticalBarChart points={charts.relatosPorSemana} />
          <p className="text-[11px] text-muted-foreground mt-3">
            Registros de atendimento das últimas 6 semanas (sua conta).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ChartDonut size={18} className="text-primary" weight="duotone" />
            Cobertura por aluno
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DonutChart
            slices={charts.coberturaAlunos}
            centerLabel={totalAlunos > 0 ? `${coberturaPercent}%` : '—'}
            centerSub={totalAlunos > 0 ? 'completo' : 'sem alunos'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ChartLineUp size={18} className="text-success" weight="duotone" />
            Presença em {mes}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {totalSlices(charts.presencaMes) === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum atendimento registrado neste mês ainda.
            </p>
          ) : (
            <DonutChart
              slices={charts.presencaMes}
              size={112}
              centerLabel={presencaMesPercent != null ? `${presencaMesPercent}%` : '—'}
              centerSub="presença"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Path size={18} className="text-brand-purple" weight="duotone" />
            Panorama da plataforma
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-5">
          <HorizontalBarChart points={charts.volumeRecursos} />
          <div className="border-t border-border pt-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Jornada pedagógica
            </p>
            <JornadaRadarBars steps={charts.jornadaProgresso} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
