import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users } from '@phosphor-icons/react'
import { buscarAlunos } from '@/services/alunoService'
import { Button } from '@/components/ui/button'
import { labelTipoAtendimentoAee } from '@/types/aluno'
import {
  useRelatorioWizardStore,
  canNavigateRelatorioTo,
  relatorioStepIndex,
  RELATORIO_WIZARD_STEPS,
} from '@/stores/relatorioWizardStore'

export function RelatorioStep1Aluno() {
  const navigate = useNavigate()
  const alunoId = useRelatorioWizardStore((s) => s.alunoId)
  const selecionarAluno = useRelatorioWizardStore((s) => s.selecionarAluno)
  const setStep = useRelatorioWizardStore((s) => s.setStep)

  const { data: alunos = [], isLoading } = useQuery({
    queryKey: ['alunos'],
    queryFn: buscarAlunos,
  })

  const alunoSelecionado = alunos.find((a) => a.id === alunoId)

  function avancar() {
    if (!alunoId) return
    setStep('periodo')
    navigate('/relatorios/novo/periodo')
  }

  const podePeriodo = canNavigateRelatorioTo('periodo', {
    ...useRelatorioWizardStore.getState(),
    alunoId,
  })

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Users size={22} weight="duotone" />
        <h2 className="text-lg font-bold text-foreground">Aluno</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Escolha o aluno para o qual este relatório pedagógico do AEE será gerado.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando alunos…</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto rounded-lg border border-border p-2">
          {alunos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aluno cadastrado.</p>
          ) : (
            alunos.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => selecionarAluno(a.id ?? null, a.nomeCompleto)}
                className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors border ${
                  alunoId === a.id
                    ? 'border-primary bg-primary/10 font-semibold text-foreground'
                    : 'border-transparent hover:bg-muted text-foreground'
                }`}
              >
                {a.nomeCompleto}
              </button>
            ))
          )}
        </div>
      )}

      {alunoSelecionado && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
          <p className="font-semibold text-foreground">Dados que serão puxados automaticamente</p>
          <p className="text-muted-foreground">Ano/turma: {alunoSelecionado.ano?.trim() || 'não informado no cadastro'}</p>
          <p className="text-muted-foreground">
            Organização do atendimento: {labelTipoAtendimentoAee(alunoSelecionado.tipoAtendimentoAee) || 'não informada no cadastro'}
          </p>
          <p className="text-muted-foreground">
            Frequência:{' '}
            {alunoSelecionado.frequenciaSemanalAtendimento != null
              ? `${alunoSelecionado.frequenciaSemanalAtendimento}x por semana`
              : 'não informada no cadastro'}
          </p>
          <p className="text-muted-foreground">
            Carga horária:{' '}
            {alunoSelecionado.duracaoAtendimentoMinutos != null
              ? `${alunoSelecionado.duracaoAtendimentoMinutos} minutos por sessão`
              : 'não informada no cadastro'}
          </p>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="button" onClick={avancar} disabled={!alunoId || !podePeriodo}>
          Continuar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Etapa {relatorioStepIndex('aluno') + 1} de {RELATORIO_WIZARD_STEPS.length}
      </p>
    </div>
  )
}
