import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users } from '@phosphor-icons/react'
import { buscarAlunos } from '@/services/alunoService'
import { Button } from '@/components/ui/button'
import {
  useEstudoCasoWizardStore,
  canNavigateEstudoCasoTo,
  estudoCasoStepIndex,
  ESTUDO_CASO_WIZARD_STEPS,
} from '@/stores/estudoCasoWizardStore'

export function EstudoCasoStep1Aluno() {
  const navigate = useNavigate()
  const alunoId = useEstudoCasoWizardStore((s) => s.alunoId)
  const selecionarAluno = useEstudoCasoWizardStore((s) => s.selecionarAluno)
  const setStep = useEstudoCasoWizardStore((s) => s.setStep)

  const { data: alunos = [], isLoading } = useQuery({
    queryKey: ['alunos'],
    queryFn: buscarAlunos,
  })

  function avancar() {
    if (!alunoId) return
    setStep('contexto')
    navigate('/estudo-caso/nova/contexto')
  }

  const podeContexto = canNavigateEstudoCasoTo('contexto', {
    ...useEstudoCasoWizardStore.getState(),
    alunoId,
  })

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Users size={22} weight="duotone" />
        <h2 className="text-lg font-bold text-foreground">Aluno</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Escolha o aluno para o qual este estudo de caso será elaborado (apoio ao PAEE).
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

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={avancar}
          disabled={!alunoId || !podeContexto}
        >
          Continuar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Etapa {estudoCasoStepIndex('aluno') + 1} de {ESTUDO_CASO_WIZARD_STEPS.length}
      </p>
    </div>
  )
}
