import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeSlash, ShieldCheck } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authTrocarSenha, authAdiarTrocaSenha, getErrorMessage, useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/useToast'

export const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Informe a senha atual'),
    novaSenha: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
    confirmarNovaSenha: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmarNovaSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarNovaSenha'],
  })
  .refine((d) => d.senhaAtual !== d.novaSenha, {
    message: 'A nova senha deve ser diferente da atual',
    path: ['novaSenha'],
  })

type FormData = z.infer<typeof changePasswordSchema>

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const { trocarSenhaConcluida, precisaTrocarSenha } = useAuth()
  const { success, error: showError, warning } = useToast()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [adiando, setAdiando] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(changePasswordSchema) })

  async function onSubmit(data: FormData) {
    try {
      await authTrocarSenha({ senhaAtual: data.senhaAtual, novaSenha: data.novaSenha })
      trocarSenhaConcluida()
      success('Senha alterada!', 'Sua senha foi atualizada com sucesso.')
      setTimeout(() => navigate('/dashboard', { replace: true }), 1000)
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      showError('Erro', msg)
    }
  }

  async function handleAdiar() {
    setAdiando(true)
    try {
      const result = await authAdiarTrocaSenha()
      if (result.success) {
        trocarSenhaConcluida()
        warning('Lembrete', 'Você poderá alterar a senha em Perfil > Preferências.')
        setTimeout(() => navigate('/dashboard', { replace: true }), 1200)
      } else {
        showError('Erro', 'Não foi possível adiar. Tente novamente.')
      }
    } finally {
      setAdiando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center bg-background p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md pt-8 md:pt-0"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-primary-light flex items-center justify-center">
              <ShieldCheck size={32} className="text-primary" weight="duotone" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-foreground text-center mb-1">
            {precisaTrocarSenha ? 'Troca de senha requerida' : 'Alterar senha'}
          </h1>
          {precisaTrocarSenha && (
            <p className="text-sm text-muted-foreground text-center mb-8">
              Por motivos de segurança, é necessário alterar sua senha antes de continuar.
            </p>
          )}
          {!precisaTrocarSenha && (
            <p className="text-sm text-muted-foreground text-center mb-8">
              Escolha uma senha forte com pelo menos 8 caracteres.
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Senha atual"
              type={showCurrent ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="cursor-pointer hover:text-primary transition-colors">
                  {showCurrent ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.senhaAtual?.message}
              {...register('senhaAtual')}
            />

            <Input
              label="Nova senha"
              type={showNew ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowNew(!showNew)} className="cursor-pointer hover:text-primary transition-colors">
                  {showNew ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.novaSenha?.message}
              {...register('novaSenha')}
            />

            <Input
              label="Confirmar nova senha"
              type={showNew ? 'text' : 'password'}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              leftIcon={<Lock size={16} />}
              error={errors.confirmarNovaSenha?.message}
              {...register('confirmarNovaSenha')}
            />

            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              Alterar senha
            </Button>

            {precisaTrocarSenha && (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="w-full text-muted-foreground"
                onClick={handleAdiar}
                loading={adiando}
              >
                Não, obrigado — alterar depois
              </Button>
            )}
          </form>
        </motion.div>
      </div>
  )
}
