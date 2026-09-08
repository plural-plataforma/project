import { CheckCircle, Circle, Warning } from '@phosphor-icons/react'
import type { RelatorioPreviewInsumos } from '@/types/relatorio'

function ItemLevantamento({ encontrado, texto }: { encontrado: boolean; texto: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {encontrado ? (
        <CheckCircle size={18} weight="fill" className="text-success shrink-0" />
      ) : (
        <Circle size={18} className="text-muted-foreground shrink-0" />
      )}
      <span className={encontrado ? 'text-foreground' : 'text-muted-foreground'}>{texto}</span>
    </div>
  )
}

interface RelatorioDadosEncontradosProps {
  preview: RelatorioPreviewInsumos
  /** Etapa de geração (item 10 do doc) inclui "Cadastro" — o levantamento (item 6) não precisa, já é óbvio. */
  mostrarCadastro?: boolean
}

export function RelatorioDadosEncontrados({ preview, mostrarCadastro = false }: RelatorioDadosEncontradosProps) {
  return (
    <div className="space-y-3">
      {mostrarCadastro && <ItemLevantamento encontrado texto="Cadastro do aluno" />}
      <ItemLevantamento
        encontrado={preview.temEstudoCaso}
        texto={preview.temEstudoCaso ? 'Estudo de Caso disponível' : 'Nenhum Estudo de Caso encontrado'}
      />
      <ItemLevantamento
        encontrado={preview.quantidadeAvaliacoesNoPeriodo > 0}
        texto={
          preview.quantidadeAvaliacoesNoPeriodo > 0
            ? `${preview.quantidadeAvaliacoesNoPeriodo} avaliação(ões) diagnóstica(s) encontrada(s) no período`
            : 'Nenhuma avaliação diagnóstica no período'
        }
      />
      <ItemLevantamento
        encontrado={preview.quantidadeLancamentosDesempenho > 0}
        texto={
          preview.quantidadeLancamentosDesempenho > 0
            ? `${preview.quantidadeLancamentosDesempenho} lançamento(s) de desempenho encontrado(s)`
            : 'Nenhum lançamento de desempenho no período'
        }
      />
      <ItemLevantamento
        encontrado={preview.quantidadePlanejamentosVigentes > 0}
        texto={
          preview.quantidadePlanejamentosVigentes > 0
            ? `${preview.quantidadePlanejamentosVigentes} PAEE vigente(s) no período`
            : 'Nenhum PAEE vigente no período'
        }
      />
      <ItemLevantamento
        encontrado={preview.quantidadeRelatosNoPeriodo > 0}
        texto={
          preview.quantidadeRelatosNoPeriodo > 0
            ? `${preview.quantidadeRelatosNoPeriodo} registro(s) de atendimento encontrado(s)`
            : 'Nenhum registro de atendimento no período'
        }
      />

      {preview.avisos.length > 0 && (
        <div className="flex items-start gap-1.5 text-amber-foreground pt-2 border-t border-border">
          <Warning size={14} className="mt-0.5 shrink-0" />
          <p className="text-sm">{preview.avisos.join(' ')}</p>
        </div>
      )}
    </div>
  )
}
