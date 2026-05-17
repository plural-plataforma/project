import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldErrors, Resolver } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { cadastraAluno, atualizaAluno } from '@/services/alunoService'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import type { Aluno, TipoAtendimentoAeeCodigo } from '@/types/aluno'
import { TIPO_ATENDIMENTO_AEE_LABELS } from '@/types/aluno'
import type { Escola } from '@/types/escolas'
import { useEffect, useMemo, useState } from 'react'
import { fetchEstados, fetchMunicipios } from '@/services/locationsService'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'

const DIAS_SEMANA_OPCOES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] as const

function buildSchema(isEditing: boolean) {
  return z
    .object({
      nomeCompleto: z.string().min(3, 'Nome obrigatório'),
      dataNascimento: z.string().optional(),
      sexo: z.string().optional(),
      nivelEnsino: z.string().optional(),
      turno: z.string().optional(),
      ano: z.string().optional(),
      cep: z.string().optional(),
      logradouro: z.string().optional(),
      numero: z.preprocess(
        (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)),
        z.number().positive('Número inválido').optional()
      ),
      complemento: z.string().optional(),
      bairro: z.string().optional(),
      estado: z.string().min(2, 'Estado obrigatório'),
      cidade: z.string().optional(),
      idEscola: z.number({ invalid_type_error: 'Selecione a escola' }).optional(),
      frequenciaSemanalAtendimento: z.coerce.number().min(1, 'Mínimo 1').max(7, 'Máximo 7'),
      diasSemana: z.array(z.string()),
      duracaoAtendimentoMinutos: z.coerce.number().min(15, 'Mínimo 15 min').max(600, 'Máximo 600 min'),
      tipoAtendimentoAee: z.coerce.number().min(0).max(3),
      perfilPotencialidades: z.string().optional(),
      perfilNecessidades: z.string().optional(),
      responsavelNome: z.string().min(2, 'Nome do responsável obrigatório'),
      responsavelTelefone: z.string().min(8, 'Telefone obrigatório'),
      responsavelEmail: z
        .union([z.literal(''), z.string().email('digite o e-mail do responsável')])
        .optional(),
      laudoCodigoCid: z.string().optional(),
      laudoNomeMedico: z.string().optional(),
      laudoDescricao: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      const dn = data.dataNascimento?.trim()
      if (!dn) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Data de nascimento obrigatória',
          path: ['dataNascimento'],
        })
      }
      if (!isEditing && (data.idEscola === undefined || data.idEscola === null || Number(data.idEscola) <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione a escola',
          path: ['idEscola'],
        })
      }
      if (data.diasSemana.length !== data.frequenciaSemanalAtendimento) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Selecione exatamente ${data.frequenciaSemanalAtendimento} dia(s) da semana`,
          path: ['diasSemana'],
        })
      }
    })
}

type FormData = z.infer<ReturnType<typeof buildSchema>>

interface AlunoFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (aluno: Aluno) => void
  escolas: Escola[]
  editingAluno?: Aluno
}

export function AlunoFormDialog({
  open,
  onClose,
  onSuccess,
  escolas,
  editingAluno,
}: AlunoFormDialogProps) {
  const isEditing = !!editingAluno
  const schema = useMemo(() => buildSchema(isEditing), [isEditing])

  const { success, error: showError } = useToast()
  const [estados, setEstados] = useState<Array<{ sigla: string; nome: string }>>([])
  const [cidades, setCidades] = useState<string[]>([])
  const [loadingCidades, setLoadingCidades] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: {
      nomeCompleto: '',
      dataNascimento: '',
      sexo: '',
      nivelEnsino: '',
      turno: '',
      ano: '',
      cep: '',
      logradouro: '',
      numero: undefined,
      complemento: '',
      bairro: '',
      estado: '',
      cidade: '',
      idEscola: undefined,
      frequenciaSemanalAtendimento: 1,
      diasSemana: [],
      duracaoAtendimentoMinutos: 50,
      tipoAtendimentoAee: 0,
      perfilPotencialidades: '',
      perfilNecessidades: '',
      responsavelNome: '',
      responsavelTelefone: '',
      responsavelEmail: '',
      laudoCodigoCid: '',
      laudoNomeMedico: '',
      laudoDescricao: '',
    },
  })

  const estadoAtual = watch('estado')
  const cidadeAtual = watch('cidade')
  const nivelEnsinoAtual = watch('nivelEnsino')
  const anoAtual = watch('ano')
  const sexoAtual = watch('sexo')
  const turnoAtual = watch('turno')
  const escolaAtual = watch('idEscola')
  const frequenciaAtual = watch('frequenciaSemanalAtendimento')
  const diasSemanaAtual = watch('diasSemana')

  const ANO_OPTIONS: Record<string, string[]> = {
    'Educação Infantil': ['Berçário', 'Maternal I', 'Maternal II', 'Jardim I', 'Jardim II', 'Pré-escola'],
    'Ensino Fundamental': ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano'],
    'Ensino Médio': ['1º Ano', '2º Ano', '3º Ano'],
  }
  const anoOptions = nivelEnsinoAtual ? (ANO_OPTIONS[nivelEnsinoAtual] ?? []) : []

  function toggleDia(dia: string) {
    const freq = Number(frequenciaAtual) || 1
    const atual = new Set(diasSemanaAtual ?? [])
    if (atual.has(dia)) {
      atual.delete(dia)
    } else if (atual.size < freq) {
      atual.add(dia)
    }
    setValue('diasSemana', Array.from(atual), { shouldDirty: true, shouldValidate: true })
  }

  useEffect(() => {
    register('sexo')
    register('turno')
    register('nivelEnsino')
    register('ano')
    register('estado')
    register('cidade')
    register('idEscola')
    register('diasSemana')
  }, [register])

  useEffect(() => {
    fetchEstados()
      .then((ufs) => setEstados(ufs.map((uf) => ({ sigla: uf.sigla, nome: uf.nome }))))
      .catch(() => setEstados([]))
  }, [])

  useEffect(() => {
    if (!estadoAtual || estadoAtual.length !== 2) {
      setCidades([])
      return
    }
    setLoadingCidades(true)
    fetchMunicipios(estadoAtual)
      .then((municipios) => setCidades(municipios.map((m) => m.nome)))
      .catch(() => setCidades([]))
      .finally(() => setLoadingCidades(false))
  }, [estadoAtual])

  /** Ao mudar a frequência, remove dias excedentes */
  useEffect(() => {
    const freq = Number(frequenciaAtual) || 1
    const dias = diasSemanaAtual ?? []
    if (dias.length > freq) {
      setValue('diasSemana', dias.slice(0, freq), { shouldValidate: true })
    }
  }, [frequenciaAtual, diasSemanaAtual, setValue])

  useEffect(() => {
    if (!open) return

    const diasServidor = editingAluno?.diasSemanaAtendimento?.length
      ? [...editingAluno.diasSemanaAtendimento]
      : []

    reset({
      nomeCompleto: editingAluno?.nomeCompleto ?? '',
      dataNascimento: editingAluno?.dataNascimento?.slice(0, 10) ?? '',
      cep: editingAluno?.cep ?? '',
      logradouro: editingAluno?.logradouro ?? '',
      numero: editingAluno?.numero && editingAluno.numero > 0 ? editingAluno.numero : undefined,
      complemento: editingAluno?.complemento ?? '',
      bairro: editingAluno?.bairro ?? '',
      estado: editingAluno?.estado ?? '',
      cidade: editingAluno?.cidade ?? '',
      sexo: editingAluno?.sexo ?? '',
      nivelEnsino: editingAluno?.nivelEnsino ?? '',
      turno: editingAluno?.turno ?? '',
      ano: editingAluno?.ano ?? '',
      idEscola: editingAluno?.idEscola,
      frequenciaSemanalAtendimento: editingAluno?.frequenciaSemanalAtendimento ?? 1,
      diasSemana: diasServidor,
      duracaoAtendimentoMinutos: editingAluno?.duracaoAtendimentoMinutos ?? 50,
      tipoAtendimentoAee: (editingAluno?.tipoAtendimentoAee ?? 0) as number,
      perfilPotencialidades: editingAluno?.perfilPedagogicoPotencialidades ?? '',
      perfilNecessidades: editingAluno?.perfilPedagogicoNecessidades ?? '',
      responsavelNome: editingAluno?.responsavel?.nomeCompleto ?? '',
      responsavelTelefone: editingAluno?.responsavel?.telefone ?? '',
      responsavelEmail: editingAluno?.responsavel?.email ?? '',
      laudoCodigoCid: editingAluno?.laudos?.[0]?.codigoCid ?? '',
      laudoNomeMedico: editingAluno?.laudos?.[0]?.nomeMedico ?? '',
      laudoDescricao: editingAluno?.laudos?.[0]?.descricao ?? '',
    })
  }, [open, editingAluno, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const laudoPreenchido =
        (data.laudoCodigoCid?.trim() ?? '') !== '' ||
        (data.laudoNomeMedico?.trim() ?? '') !== '' ||
        (data.laudoDescricao?.trim() ?? '') !== ''

      const laudos = laudoPreenchido
        ? [
            {
              codigoCid: data.laudoCodigoCid?.trim() ?? '',
              nomeMedico: data.laudoNomeMedico?.trim() ?? '',
              descricao: data.laudoDescricao?.trim() ?? '',
            },
          ]
        : []

      const tipo = Number(data.tipoAtendimentoAee) as TipoAtendimentoAeeCodigo

      const payload: Partial<Aluno> = {
        ...(editingAluno?.id ? { id: editingAluno.id } : {}),
        nomeCompleto: data.nomeCompleto,
        dataNascimento: data.dataNascimento?.trim() || undefined,
        cep: data.cep ?? '',
        logradouro: data.logradouro ?? '',
        numero: data.numero,
        complemento: data.complemento ?? '',
        bairro: data.bairro ?? '',
        estado: data.estado,
        cidade: data.cidade ?? '',
        sexo: data.sexo ?? '',
        nivelEnsino: data.nivelEnsino ?? '',
        turno: data.turno ?? '',
        ano: data.ano ?? '',
        idEscola: data.idEscola ?? 0,
        frequenciaSemanalAtendimento: data.frequenciaSemanalAtendimento,
        diasSemanaAtendimento: data.diasSemana,
        duracaoAtendimentoMinutos: data.duracaoAtendimentoMinutos,
        tipoAtendimentoAee: tipo,
        perfilPedagogicoPotencialidades: data.perfilPotencialidades?.trim() || null,
        perfilPedagogicoNecessidades: data.perfilNecessidades?.trim() || null,
        responsavel: {
          nomeCompleto: data.responsavelNome,
          telefone: data.responsavelTelefone,
          email: data.responsavelEmail?.trim() ? data.responsavelEmail.trim() : null,
        },
        laudos,
      }

      return editingAluno?.id ? atualizaAluno(payload) : cadastraAluno(payload)
    },
    onSuccess: (aluno) => {
      success(editingAluno ? 'Aluno atualizado!' : 'Aluno cadastrado!')
      reset()
      onSuccess(aluno)
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const handleInvalidSubmit = (formErrors: FieldErrors<FormData>) => {
    const messages = Object.values(formErrors)
      .map((error) => error?.message)
      .filter((message): message is string => typeof message === 'string' && message.length > 0)

    showError(
      'Validação',
      messages.length > 0 ? messages.join(' | ') : 'Preencha os campos obrigatórios antes de salvar.'
    )
  }

  const tipoAtendimentoStr = String(watch('tipoAtendimentoAee') ?? 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingAluno ? 'Editar aluno' : 'Novo aluno'}</DialogTitle>
          <DialogDescription>
            Dados gerais, atendimento no AEE, perfil pedagógico e responsável pela matrícula.
          </DialogDescription>
        </DialogHeader>

        <form
          key={`${editingAluno?.id ?? 'novo'}-${open}`}
          onSubmit={handleSubmit((d) => mutation.mutate(d), handleInvalidSubmit)}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Nome completo"
            placeholder="Nome do aluno"
            error={errors.nomeCompleto?.message}
            {...register('nomeCompleto')}
          />

          <Input
            label="Data de nascimento"
            type="date"
            error={errors.dataNascimento?.message}
            {...register('dataNascimento')}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Sexo</label>
              <Select value={sexoAtual ?? ''} onValueChange={(v) => setValue('sexo', v, { shouldDirty: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                  <SelectItem value="O">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Turno</label>
              <Select value={turnoAtual ?? ''} onValueChange={(v) => setValue('turno', v, { shouldDirty: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manhã">Manhã</SelectItem>
                  <SelectItem value="Tarde">Tarde</SelectItem>
                  <SelectItem value="Noite">Noite</SelectItem>
                  <SelectItem value="Integral">Integral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Nível de ensino</label>
              <Select
                onValueChange={(v) => {
                  setValue('nivelEnsino', v, { shouldDirty: true })
                  setValue('ano', '', { shouldDirty: true })
                }}
                value={nivelEnsinoAtual ?? ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Educação Infantil">Educação Infantil</SelectItem>
                  <SelectItem value="Ensino Fundamental">Ensino Fundamental</SelectItem>
                  <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Ano / Série</label>
              <Select
                onValueChange={(v) => setValue('ano', v, { shouldDirty: true })}
                value={anoAtual ?? ''}
                disabled={anoOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={anoOptions.length === 0 ? 'Selecione o nível' : 'Selecione'} />
                </SelectTrigger>
                <SelectContent>
                  {anoOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Estado (UF)</label>
              <Select
                value={estadoAtual ?? ''}
                onValueChange={(v) => {
                  setValue('estado', v, { shouldValidate: true })
                  setValue('cidade', '', { shouldValidate: true })
                }}
              >
                <SelectTrigger error={errors.estado?.message}>
                  <SelectValue placeholder="Selecionar UF" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((uf) => (
                    <SelectItem key={uf.sigla} value={uf.sigla}>
                      {uf.sigla} — {uf.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.estado && <p className="text-xs text-danger font-medium">{errors.estado.message}</p>}
            </div>
            <div />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">Cidade</label>
            <Select
              value={cidadeAtual ?? ''}
              onValueChange={(v) => setValue('cidade', v, { shouldValidate: true })}
              disabled={!estadoAtual || loadingCidades}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCidades ? 'Carregando cidades...' : 'Selecionar cidade'} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {cidades.map((cidade) => (
                  <SelectItem key={cidade} value={cidade}>
                    {cidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {escolas.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Escola</label>
              <Select
                onValueChange={(v) => setValue('idEscola', Number(v), { shouldDirty: true, shouldValidate: true })}
                value={escolaAtual != null && escolaAtual > 0 ? String(escolaAtual) : ''}
              >
                <SelectTrigger error={errors.idEscola?.message}>
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
              {errors.idEscola && <p className="text-xs text-danger font-medium">{errors.idEscola.message}</p>}
            </div>
          )}

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-bold text-foreground">Informações do atendimento (AEE)</p>
            <p className="text-xs text-muted-foreground">
              Usadas para planejamento e relatos. A quantidade de dias marcados deve coincidir com a frequência
              semanal.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Vezes por semana"
                type="number"
                min={1}
                max={7}
                error={errors.frequenciaSemanalAtendimento?.message}
                {...register('frequenciaSemanalAtendimento', { valueAsNumber: true })}
              />
              <Input
                label="Duração (minutos)"
                type="number"
                min={15}
                max={600}
                error={errors.duracaoAtendimentoMinutos?.message}
                {...register('duracaoAtendimentoMinutos', { valueAsNumber: true })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Tipo de atendimento</label>
              <Select
                value={tipoAtendimentoStr}
                onValueChange={(v) => setValue('tipoAtendimentoAee', Number(v), { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {([0, 1, 2, 3] as const).map((codigo) => (
                    <SelectItem key={codigo} value={String(codigo)}>
                      {TIPO_ATENDIMENTO_AEE_LABELS[codigo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">
                Dias da semana ({diasSemanaAtual?.length ?? 0}/{Number(frequenciaAtual) || 1})
              </span>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA_OPCOES.map((dia) => {
                  const checked = diasSemanaAtual?.includes(dia)
                  const freq = Number(frequenciaAtual) || 1
                  const disabledToggle = !checked && (diasSemanaAtual?.length ?? 0) >= freq
                  return (
                    <label
                      key={dia}
                      className={`flex items-center gap-2 rounded-md border px-2 py-1 text-sm cursor-pointer ${
                        checked ? 'border-primary bg-primary/10' : 'border-border'
                      } ${disabledToggle ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={!!checked}
                        disabled={disabledToggle}
                        onChange={() => toggleDia(dia)}
                      />
                      {dia}
                    </label>
                  )
                })}
              </div>
              {errors.diasSemana && (
                <p className="text-xs text-danger font-medium">{errors.diasSemana.message as string}</p>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-bold text-foreground">Perfil pedagógico do aluno</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Potencialidades</label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Descreva ou liste potencialidades observadas"
                {...register('perfilPotencialidades')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Necessidades educacionais</label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Descreva necessidades de aprendizagem / barreiras pedagógicas"
                {...register('perfilNecessidades')}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-bold text-foreground">Documentação clínica (opcional)</p>
            <Input label="CID (opcional)" {...register('laudoCodigoCid')} />
            <Input label="Nome do médico (opcional)" {...register('laudoNomeMedico')} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Observações do laudo (opcional)</label>
              <textarea
                className="min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('laudoDescricao')}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-bold text-foreground mb-3">Responsável pela matrícula</p>
            <div className="space-y-3">
              <Input
                label="Nome do responsável"
                placeholder="Nome completo"
                error={errors.responsavelNome?.message}
                {...register('responsavelNome')}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Telefone"
                  placeholder="(11) 99999-9999"
                  error={errors.responsavelTelefone?.message}
                  {...register('responsavelTelefone')}
                />
                <Input
                  label="E-mail (opcional)"
                  type="email"
                  placeholder="email@exemplo.com"
                  error={errors.responsavelEmail?.message}
                  {...register('responsavelEmail')}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting || mutation.isPending}>
              {editingAluno ? 'Salvar alterações' : 'Cadastrar aluno'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
