import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAvaliacaoWizardStore } from '@/stores/avaliacaoWizardStore'
import { useQuery } from '@tanstack/react-query'
import { buscarEscolasProfessor } from '@/services/professorService'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight } from '@phosphor-icons/react'

const schema = z.object({
  titulo: z.string().min(3, 'Título obrigatório (mínimo 3 caracteres)'),
  dataAplicacao: z.string().min(1, 'Data obrigatória'),
  escolaId: z.number().min(1, 'Selecione uma escola'),
  objetivo: z.string().min(3, 'Objetivo é obrigatório (mínimo 3 caracteres)'),
})

type FormData = z.infer<typeof schema>

export function WizardStep1Identificacao() {
  const navigate = useNavigate()
  const { updateData, markStepComplete, data, isEditing, avaliacaoId } = useAvaliacaoWizardStore()

  const { data: escolas = [] } = useQuery({
    queryKey: ['escolas-professor'],
    queryFn: buscarEscolasProfessor,
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: data.titulo,
      dataAplicacao: data.dataAplicacao,
      escolaId: data.escolaId,
      objetivo: data.objetivo,
    },
  })

  useEffect(() => {
    reset({
      titulo: data.titulo,
      dataAplicacao: data.dataAplicacao,
      escolaId: data.escolaId ?? undefined,
      objetivo: data.objetivo,
    })
  }, [data, reset])

  function onSubmit(formData: FormData) {
    updateData({
      titulo: formData.titulo,
      dataAplicacao: formData.dataAplicacao,
      escolaId: formData.escolaId,
      objetivo: formData.objetivo,
    })
    markStepComplete('identificacao')
    navigate(isEditing && avaliacaoId ? `/avaliacoes/editar/${avaliacaoId}/alunos` : '/avaliacoes/nova/alunos')
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Identificação da Avaliação</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Defina o nome, data e a escola onde será aplicada.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Nome da avaliação"
          placeholder="Ex: Diagnóstico Janeiro 2026"
          error={errors.titulo?.message}
          {...register('titulo')}
        />

        <Input
          label="Data da avaliação"
          type="date"
          error={errors.dataAplicacao?.message}
          {...register('dataAplicacao')}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold">Escola</label>
          <Select
            onValueChange={(v) => setValue('escolaId', Number(v))}
            defaultValue={data.escolaId ? String(data.escolaId) : undefined}
          >
            <SelectTrigger error={errors.escolaId?.message}>
              <SelectValue placeholder="Selecionar escola" />
            </SelectTrigger>
            <SelectContent>
              {escolas.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.nomeInstituicao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.escolaId && (
            <p className="text-xs text-danger font-medium">{errors.escolaId.message}</p>
          )}
        </div>

        <Input
          label="Objetivo"
          placeholder="Descreva o objetivo desta avaliação"
          error={errors.objetivo?.message}
          {...register('objetivo')}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit">
            Próximo
            <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </div>
  )
}
