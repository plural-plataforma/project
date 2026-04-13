import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useForm, type FieldErrors } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PencilSimple, Check, X as XIcon, UserCircle, MapPin, GraduationCap, WarningCircle } from '@phosphor-icons/react'
import { type AxiosError } from 'axios'
import {
  buscarProfessor,
  atualizarProfessor,
  buscarEscolasProfessor,
  desvincularEscola,
  getCadastroPendencias,
} from '@/services/professorService'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import type { Professor } from '@/types/professor'
import { fetchCepData } from '@/services/locationsService'

const schema = z.object({
  nomeCompleto: z.string().min(3, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  disciplinas: z.string().optional(),
  nivelEnsino: z.string().optional(),
  sobre: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.preprocess(
    (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)),
    z.number().positive('Número inválido').optional()
  ),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  sexo: z.string().optional(),
})

type FormInput = z.input<typeof schema>
type FormData = z.output<typeof schema>

type ApiErrorData = {
  mensagens?: string[]
  message?: string
  title?: string
  errors?: string[] | Record<string, string[]>
}

const formatTelefone = (value?: string): string => {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) return digits ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiErrorData>
  const data = axiosError.response?.data

  if (data) {
    if (Array.isArray(data.mensagens) && data.mensagens.length > 0) return data.mensagens.join(', ')
    if (typeof data.message === 'string' && data.message.trim()) return data.message
    if (typeof data.title === 'string' && data.title.trim()) return data.title
    if (Array.isArray(data.errors) && data.errors.length > 0) return data.errors[0] ?? fallback
    if (data.errors && typeof data.errors === 'object') {
      const firstError = Object.values(data.errors).flat()[0]
      if (firstError) return firstError
    }
  }

  return axiosError.message || fallback
}

export default function PerfilPage() {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [editing, setEditing] = useState(false)
  const [isLogradouroLocked, setIsLogradouroLocked] = useState(true)
  const [isBairroLocked, setIsBairroLocked] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['professor'],
    queryFn: buscarProfessor,
  })
  const { data: escolasVinculadas = [] } = useQuery({
    queryKey: ['escolas-professor'],
    queryFn: buscarEscolasProfessor,
  })

  const professor = data?.objeto

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    values: professor
      ? {
          nomeCompleto: professor.nomeCompleto,
          email: professor.email ?? '',
          telefone: formatTelefone(professor.telefone ?? ''),
          disciplinas: professor.disciplinas ?? '',
          nivelEnsino: professor.nivelEnsino ?? '',
          sobre: professor.sobre ?? '',
          cep: professor.cep ?? '',
          logradouro: professor.logradouro ?? '',
          numero: professor.numero,
          complemento: professor.complemento ?? '',
          bairro: professor.bairro ?? '',
          cidade: professor.cidade ?? '',
          estado: professor.estado ?? '',
          sexo: professor.sexo ?? '',
        }
      : undefined,
  })

  const estadoAtual = watch('estado')
  const cidadeAtual = watch('cidade')
  const telefoneAtual = watch('telefone')

  useEffect(() => {
    setIsLogradouroLocked(Boolean((professor?.logradouro ?? '').trim()))
    setIsBairroLocked(Boolean((professor?.bairro ?? '').trim()))
  }, [professor?.logradouro, professor?.bairro])

  async function applyCepData(cep?: string): Promise<boolean> {
    const cepDigits = (cep ?? '').replace(/\D/g, '')
    if (cepDigits.length !== 8) return true

    try {
      const data = await fetchCepData(cepDigits)
      if (!data) {
        showError('CEP não encontrado', 'Verifique o CEP informado para preencher o endereço.')
        return false
      }

      setValue('estado', data.uf?.toUpperCase() ?? '', { shouldValidate: true })
      setValue('cidade', data.localidade ?? '', { shouldValidate: true })
      setValue('logradouro', data.logradouro ?? '', { shouldValidate: true })
      setValue('bairro', data.bairro ?? '', { shouldValidate: true })
      setIsLogradouroLocked(Boolean((data.logradouro ?? '').trim()))
      setIsBairroLocked(Boolean((data.bairro ?? '').trim()))
      return true
    } catch (error) {
      console.error('[PerfilPage] Erro ao buscar CEP', error)
      showError('Erro ao buscar CEP', 'Não foi possível preencher o endereço automaticamente.')
      return false
    }
  }

  async function handleCepBlur(cep?: string) {
    await applyCepData(cep)
  }

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) =>
      atualizarProfessor({
        ...(professor as Professor),
        ...formData,
        telefone: formatTelefone(formData.telefone),
        aceitouTermos: professor?.aceitouTermos ?? false,
        escolas: escolasVinculadas.map((e) => String(e.id)),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['professor'] })
      success('Perfil atualizado!', 'Suas informações foram salvas.')
      setEditing(false)
    },
    onError: (err: unknown) => {
      const message = getApiErrorMessage(err, 'Não foi possível atualizar o perfil.')
      console.error('[PerfilPage] Erro ao atualizar perfil', err)
      showError('Erro ao salvar perfil', message)
    },
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

  async function handleValidSubmit(data: FormData) {
    const cepOk = await applyCepData(data.cep)
    if (!cepOk) return

    await updateMutation.mutateAsync(data)
  }

  function handleInvalidSubmit(formErrors: FieldErrors<FormInput>) {
    console.error('[PerfilPage] Erros de validação no formulário', formErrors)
    showError('Formulário inválido', 'Corrija os campos destacados e tente novamente.')
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
                onClick={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
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

            <p className="text-sm text-muted-foreground">
              Para cadastrar ou vincular uma escola ao seu perfil, acesse a página{' '}
              <Link to="/escolas" className="font-semibold text-primary underline underline-offset-2">
                Escolas
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        {editing ? (
          <form onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)} className="space-y-4" noValidate>
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
                  <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
                  <Input
                    label="Telefone"
                    placeholder="(11) 99999-9999"
                    error={errors.telefone?.message}
                    value={telefoneAtual ?? ''}
                    inputMode="numeric"
                    maxLength={15}
                    {...register('telefone', {
                      onChange: (event) => {
                        event.target.value = formatTelefone(event.target.value)
                      },
                    })}
                  />
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
                  <Input label="Cidade" value={cidadeAtual ?? ''} readOnly disabled />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input
                      label="Logradouro"
                      placeholder="Rua, Avenida..."
                      {...register('logradouro')}
                      readOnly={isLogradouroLocked}
                      disabled={isLogradouroLocked}
                    />
                  </div>
                  <Input
                    label="Número"
                    type="number"
                    error={errors.numero?.message}
                    {...register('numero', { valueAsNumber: true })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Complemento (opcional)" placeholder="Apto, bloco, referência..." {...register('complemento')} />
                  <Input
                    label="Bairro"
                    {...register('bairro')}
                    readOnly={isBairroLocked}
                    disabled={isBairroLocked}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Estado (UF)" value={estadoAtual ?? ''} readOnly disabled />
                  <div />
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
                  { label: 'Número', value: professor?.numero?.toString() },
                  { label: 'Complemento', value: professor?.complemento },
                  { label: 'Bairro', value: professor?.bairro },
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
