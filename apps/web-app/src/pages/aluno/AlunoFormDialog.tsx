import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
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
import type { Aluno } from '@/types/aluno'
import type { Escola } from '@/types/escolas'
import { useEffect, useState } from 'react'
import { fetchEstados, fetchMunicipios } from '@/services/locationsService'

const schema = z.object({
  nomeCompleto: z.string().min(3, 'Nome obrigatório'),
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
  idEscola: z.number().optional(),
  responsavelNome: z.string().min(2, 'Nome do responsável obrigatório'),
  responsavelTelefone: z.string().min(8, 'Telefone obrigatório'),
  responsavelEmail: z
    .union([z.literal(''), z.string().email('digite o e-mail do responsável')])
    .optional(),
  laudoCodigoCid: z.string().optional(),
  laudoNomeMedico: z.string().optional(),
  laudoDescricao: z.string().optional(),
})

type FormData = z.infer<typeof schema>

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: editingAluno
      ? {
          nomeCompleto: editingAluno.nomeCompleto,
          cep: editingAluno.cep,
          logradouro: editingAluno.logradouro,
          numero: editingAluno.numero,
          complemento: editingAluno.complemento,
          bairro: editingAluno.bairro,
          estado: editingAluno.estado,
          cidade: editingAluno.cidade,
          sexo: editingAluno.sexo,
          nivelEnsino: editingAluno.nivelEnsino,
          turno: editingAluno.turno,
          ano: editingAluno.ano,
          idEscola: editingAluno.idEscola,
          responsavelNome: editingAluno.responsavel?.nomeCompleto,
          responsavelTelefone: editingAluno.responsavel?.telefone,
          responsavelEmail: editingAluno.responsavel?.email,
          laudoCodigoCid: editingAluno.laudos?.[0]?.codigoCid ?? '',
          laudoNomeMedico: editingAluno.laudos?.[0]?.nomeMedico ?? '',
          laudoDescricao: editingAluno.laudos?.[0]?.descricao ?? '',
        }
      : undefined,
  })

  const estadoAtual = watch('estado')
  const cidadeAtual = watch('cidade')

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

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: Partial<Aluno> = {
        ...(editingAluno?.id ? { id: editingAluno.id } : {}),
        nomeCompleto: data.nomeCompleto,
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
        responsavel: {
          nomeCompleto: data.responsavelNome,
          telefone: data.responsavelTelefone,
          email: data.responsavelEmail?.trim() ? data.responsavelEmail.trim() : null,
        },
        laudos:
          editingAluno?.laudos ?? [],
      }
      // console.log('[AlunoFormDialog] payload →', JSON.stringify(payload, null, 2))
      return editingAluno?.id ? atualizaAluno(payload) : cadastraAluno(payload)
    },
    onSuccess: (aluno) => {
      success(editingAluno ? 'Aluno atualizado!' : 'Aluno cadastrado!')
      reset()
      onSuccess(aluno)
    },
    onError: (err: Error) => showError('Erro', err.message),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAluno ? 'Editar aluno' : 'Novo aluno'}</DialogTitle>
            <DialogDescription>Preencha os dados do aluno e do responsável.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
            <Input
              label="Nome completo"
              placeholder="Nome do aluno"
              error={errors.nomeCompleto?.message}
              {...register('nomeCompleto')}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Sexo</label>
                <Select onValueChange={(v) => setValue('sexo', v)} defaultValue={editingAluno?.sexo}>
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
                <Select onValueChange={(v) => setValue('turno', v)} defaultValue={editingAluno?.turno}>
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
                  onValueChange={(v) => setValue('idEscola', Number(v))}
                  defaultValue={editingAluno?.idEscola ? String(editingAluno.idEscola) : undefined}
                >
                  <SelectTrigger>
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
              </div>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-sm font-bold text-foreground mb-3">Responsável</p>
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
