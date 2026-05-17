import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Buildings, MagnifyingGlass, PencilSimple, MapPin } from '@phosphor-icons/react'
import { buscarEscolasProfessor, vincularEscola } from '@/services/professorService'
import { salvarEscola } from '@/services/escolasService'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Escola } from '@/types/escolas'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { sortByField } from '@/lib/utils'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { fetchCepData, fetchEstados, fetchMunicipios } from '@/services/locationsService'

export const escolaSchema = z.object({
  nomeInstituicao: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  estado: z.string().min(2, 'Estado obrigatório'),
  cidade: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  // valueAsNumber retorna NaN quando vazio — preprocess converte para undefined
  numero: z.preprocess(
    (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)),
    z.number().positive('Número inválido').optional()
  ),
  bairro: z.string().optional(),
})

type EscolaForm = z.infer<typeof escolaSchema>

export default function EscolasPage() {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [search, setSearch] = useState('')
  const [editingEscola, setEditingEscola] = useState<Escola | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [estados, setEstados] = useState<Array<{ sigla: string; nome: string }>>([])
  const [cidades, setCidades] = useState<string[]>([])
  const [loadingCidades, setLoadingCidades] = useState(false)

  const { data: escolasVinculadas = [], isLoading } = useQuery({
    queryKey: ['escolas-professor'],
    queryFn: buscarEscolasProfessor,
  })

  const salvarMutation = useMutation({
    mutationFn: salvarEscola,
    onSuccess: async (escola) => {
      await vincularEscola(escola.id)
      qc.invalidateQueries({ queryKey: ['escolas-professor'] })
      success('Escola salva!', 'A escola foi cadastrada e vinculada ao seu perfil.')
      setDialogOpen(false)
      setEditingEscola(null)
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<EscolaForm>({ resolver: zodResolver(escolaSchema) as any })

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

  async function handleCepBlur(cep?: string) {
    const data = await fetchCepData(cep ?? '')
    if (!data) return
    if (data.uf) setValue('estado', data.uf.toUpperCase(), { shouldValidate: true })
    if (data.localidade) setValue('cidade', data.localidade, { shouldValidate: true })
    if (data.logradouro) setValue('logradouro', data.logradouro, { shouldValidate: true })
    if (data.bairro) setValue('bairro', data.bairro, { shouldValidate: true })
  }

  function openCreate() {
    reset({})
    setEditingEscola(null)
    setDialogOpen(true)
  }

  function openEdit(escola: Escola) {
    reset({
      nomeInstituicao: escola.nomeInstituicao,
      estado: escola.estado,
      cidade: escola.cidade,
      cep: escola.cep,
      logradouro: escola.logradouro,
      numero: escola.numero,
      bairro: escola.bairro,
    })
    setEditingEscola(escola)
    setDialogOpen(true)
  }

  function onSubmit(data: EscolaForm) {
    salvarMutation.mutate({ ...data, id: editingEscola?.id })
  }

  const filtered = sortByField(
    escolasVinculadas.filter((e) =>
      e.nomeInstituicao.toLowerCase().includes(search.toLowerCase()) ||
      e.cidade?.toLowerCase().includes(search.toLowerCase()) ||
      e.estado.toLowerCase().includes(search.toLowerCase())
    ),
    'nomeInstituicao'
  )

  return (
    <>
      <LoadingScreen visible={salvarMutation.isPending} message="Salvando escola..." />
      <PageHeader
        title="Escolas"
        description="Gerencie as escolas vinculadas ao seu perfil"
        action={
          <Button onClick={openCreate}>
            <Plus size={16} weight="bold" />
            Nova escola
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Buscar por nome, cidade ou estado..."
          leftIcon={<MagnifyingGlass size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Buildings size={32} />}
          title={search ? 'Nenhuma escola encontrada' : 'Nenhuma escola vinculada'}
          description={
            search
              ? 'Tente outro termo de busca.'
              : 'Cadastre e vincule a primeira escola para desbloquear os demais módulos.'
          }
          action={
            !search && (
              <Button onClick={openCreate}>
                <Plus size={16} weight="bold" />
                Cadastrar escola
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((escola, i) => (
              <motion.div
                key={escola.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Card className="p-5 hover:border-primary transition-colors duration-200 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                        <Buildings size={20} className="text-primary" weight="duotone" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">{escola.nomeInstituicao}</h3>
                        {(escola.cidade || escola.estado) && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                            <MapPin size={12} />
                            <span>{[escola.cidade, escola.estado].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                        {escola.tipo && (
                          <Badge variant="default" className="mt-2">
                            {escola.tipo}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(escola)}
                      aria-label="Editar escola"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <PencilSimple size={16} />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEscola ? 'Editar escola' : 'Nova escola'}</DialogTitle>
            <DialogDescription>
              {editingEscola
                ? 'Atualize os dados da escola.'
                : 'Preencha os dados para cadastrar e vincular uma nova escola.'}
            </DialogDescription>
          </DialogHeader>

          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4" noValidate>
            <Input
              label="Nome da instituição"
              placeholder="Ex: Escola Municipal João da Silva"
              error={errors.nomeInstituicao?.message}
              {...register('nomeInstituicao')}
            />

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
                  <SelectContent>
                    {cidades.map((cidade) => (
                      <SelectItem key={cidade} value={cidade}>
                        {cidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="CEP" placeholder="00000-000" {...register('cep')} onBlur={(e) => handleCepBlur(e.target.value)} />
              <Input
                label="Número"
                type="number"
                placeholder="123"
                error={errors.numero?.message}
                {...register('numero', { valueAsNumber: true })}
              />
            </div>

            <Input label="Logradouro" placeholder="Rua, Avenida..." {...register('logradouro')} />
            <Input label="Bairro" placeholder="Nome do bairro" {...register('bairro')} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={isSubmitting || salvarMutation.isPending}>
                {editingEscola ? 'Salvar alterações' : 'Cadastrar escola'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
