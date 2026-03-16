import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PencilSimple, Check, X as XIcon, UserCircle, MapPin, GraduationCap, WarningCircle } from '@phosphor-icons/react'
import {
  buscarProfessor,
  atualizarProfessor,
  buscarEscolasProfessor,
  desvincularEscola,
  vincularEscola,
  getCadastroPendencias,
} from '@/services/professorService'
import { buscarEscolas } from '@/services/escolasService'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import type { Professor } from '@/types/professor'
import { fetchCepData, fetchEstados, fetchMunicipios } from '@/services/locationsService'

const schema = z.object({
  nomeCompleto: z.string().min(3, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  disciplinas: z.string().optional(),
  nivelEnsino: z.string().optional(),
  sobre: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.number().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  sexo: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function PerfilPage() {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [editing, setEditing] = useState(false)
  const [estados, setEstados] = useState<Array<{ sigla: string; nome: string }>>([])
  const [cidades, setCidades] = useState<string[]>([])
  const [loadingCidades, setLoadingCidades] = useState(false)
  const [escolaParaVincular, setEscolaParaVincular] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['professor'],
    queryFn: buscarProfessor,
  })
  const { data: escolasVinculadas = [] } = useQuery({
    queryKey: ['escolas-professor'],
    queryFn: buscarEscolasProfessor,
  })
  const { data: todasEscolas = [] } = useQuery({
    queryKey: ['todas-escolas'],
    queryFn: buscarEscolas,
  })

  const professor = data?.objeto
  const escolasDisponiveis = useMemo(
    () => todasEscolas.filter((e) => !escolasVinculadas.some((v) => v.id === e.id)),
    [escolasVinculadas, todasEscolas]
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    values: professor
      ? {
          nomeCompleto: professor.nomeCompleto,
          email: professor.email ?? '',
          telefone: professor.telefone ?? '',
          disciplinas: professor.disciplinas ?? '',
          nivelEnsino: professor.nivelEnsino ?? '',
          sobre: professor.sobre ?? '',
          cep: professor.cep ?? '',
          logradouro: professor.logradouro ?? '',
          numero: professor.numero,
          bairro: professor.bairro ?? '',
          cidade: professor.cidade ?? '',
          estado: professor.estado ?? '',
          sexo: professor.sexo ?? '',
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

  async function handleCepBlur(cep?: string) {
    const data = await fetchCepData(cep ?? '')
    if (!data) return
    if (data.uf) setValue('estado', data.uf.toUpperCase(), { shouldValidate: true })
    if (data.localidade) setValue('cidade', data.localidade, { shouldValidate: true })
    if (data.logradouro) setValue('logradouro', data.logradouro, { shouldValidate: true })
    if (data.bairro) setValue('bairro', data.bairro, { shouldValidate: true })
  }

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) =>
      atualizarProfessor({
        ...(professor as Professor),
        ...formData,
        numero: formData.numero ?? 0,
        aceitouTermos: professor?.aceitouTermos ?? false,
        escolas: escolasVinculadas.map((e) => String(e.id)),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['professor'] })
      success('Perfil atualizado!', 'Suas informações foram salvas.')
      setEditing(false)
    },
    onError: (err: Error) => showError('Erro', err.message),
  })

  const vincularMutation = useMutation({
    mutationFn: (idEscola: number) => vincularEscola(idEscola),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escolas-professor'] })
      success('Escola vinculada!', 'A escola foi vinculada ao seu perfil.')
      setEscolaParaVincular('')
    },
    onError: (err: Error) => showError('Erro', err.message),
  })

  const desvincularMutation = useMutation({
    mutationFn: (idEscola: number) => desvincularEscola(idEscola),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escolas-professor'] })
      success('Escola desvinculada!', 'A escola foi removida do seu perfil.')
    },
    onError: (err: Error) => showError('Erro', err.message),
  })

  function handleCancel() {
    reset()
    setEditing(false)
  }

  if (isLoading) return <SkeletonList count={3} />

  const initials = professor?.nomeCompleto
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? '?'
  const cadastroPendencias = getCadastroPendencias(professor, escolasVinculadas.length)
  const cadastroCompleto = cadastroPendencias.length === 0

  return (
    <>
      <PageHeader
        title="Meu Perfil"
        action={
          !editing ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <PencilSimple size={16} />
              Editar perfil
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <XIcon size={16} />
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit((d: any) => updateMutation.mutate(d))} // eslint-disable-line @typescript-eslint/no-explicit-any
                loading={isSubmitting || updateMutation.isPending}
              >
                <Check size={16} weight="bold" />
                Salvar
              </Button>
            </div>
          )
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {!cadastroCompleto && (
          <Card className="border-amber/40 bg-amber-light">
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-start gap-2">
                <WarningCircle size={18} className="text-amber-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground">Cadastro incompleto</p>
                  <p className="text-sm text-muted-foreground">
                    Para liberar todos os recursos, preencha os itens abaixo:
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {cadastroPendencias.map((pendencia) => (
                  <Badge key={pendencia.key} variant="amber">
                    {pendencia.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Avatar card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-black text-foreground">{professor?.nomeCompleto}</h2>
                {professor?.email && (
                  <p className="text-sm text-muted-foreground">{professor.email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escolas vinculadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {escolasVinculadas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma escola vinculada ao perfil.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {escolasVinculadas.map((escola) => (
                  <Badge key={escola.id} variant="default" className="flex items-center gap-2">
                    {escola.nomeInstituicao}
                    <button
                      type="button"
                      onClick={() => desvincularMutation.mutate(escola.id)}
                      className="text-xs underline underline-offset-2 cursor-pointer"
                    >
                      remover
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Select value={escolaParaVincular} onValueChange={setEscolaParaVincular}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar escola para vincular" />
                </SelectTrigger>
                <SelectContent>
                  {escolasDisponiveis.map((escola) => (
                    <SelectItem key={escola.id} value={String(escola.id)}>
                      {escola.nomeInstituicao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                disabled={!escolaParaVincular}
                loading={vincularMutation.isPending}
                onClick={() => vincularMutation.mutate(Number(escolaParaVincular))}
              >
                Vincular
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {editing ? (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <form onSubmit={handleSubmit((d: any) => updateMutation.mutate(d))} className="space-y-4" noValidate>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle size={16} className="text-primary" />
                  Dados pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  label="Nome completo"
                  error={errors.nomeCompleto?.message}
                  {...register('nomeCompleto')}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="E-mail" type="email" {...register('email')} />
                  <Input label="Telefone" placeholder="(11) 99999-9999" {...register('telefone')} />
                </div>
                <Input label="Sobre você" placeholder="Apresentação breve..." {...register('sobre')} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-primary" />
                  Dados profissionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input label="Disciplinas" placeholder="Ex: Matemática, Ciências" {...register('disciplinas')} />
                <Input label="Nível de ensino" placeholder="Ex: Fundamental II" {...register('nivelEnsino')} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="CEP" placeholder="00000-000" {...register('cep')} onBlur={(e) => handleCepBlur(e.target.value)} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold">Estado (UF)</label>
                    <Select
                      value={estadoAtual ?? ''}
                      onValueChange={(v) => {
                        setValue('estado', v, { shouldValidate: true })
                        setValue('cidade', '', { shouldValidate: true })
                      }}
                    >
                      <SelectTrigger>
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
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input label="Logradouro" placeholder="Rua, Avenida..." {...register('logradouro')} />
                  </div>
                  <Input label="Número" type="number" {...register('numero')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Bairro" {...register('bairro')} />
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
              </CardContent>
            </Card>
          </form>
        ) : (
          <div className="space-y-4">
            {[
              {
                title: 'Dados pessoais',
                icon: UserCircle,
                items: [
                  { label: 'Telefone', value: professor?.telefone },
                  { label: 'Sexo', value: professor?.sexo },
                  { label: 'Sobre', value: professor?.sobre },
                ],
              },
              {
                title: 'Profissional',
                icon: GraduationCap,
                items: [
                  { label: 'Disciplinas', value: professor?.disciplinas },
                  { label: 'Nível de ensino', value: professor?.nivelEnsino },
                ],
              },
              {
                title: 'Endereço',
                icon: MapPin,
                items: [
                  { label: 'CEP', value: professor?.cep },
                  { label: 'Logradouro', value: professor?.logradouro },
                  { label: 'Cidade', value: professor?.cidade },
                  { label: 'Estado', value: professor?.estado },
                ],
              },
            ].map(({ title, icon: Icon, items }) => {
              const validItems = items.filter((i) => i.value)
              if (!validItems.length) return null
              return (
                <Card key={title}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon size={16} className="text-primary" />
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {validItems.map(({ label, value }) => (
                        <div key={label} className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground font-medium">{label}</span>
                          <span className="text-sm font-semibold text-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </motion.div>
    </>
  )
}
