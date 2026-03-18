import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Eye, EyeSlash, Lock, Envelope, User } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authRegister, getErrorMessage, useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/useToast'

export const registerSchema = z
  .object({
    nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmarSenha: z.string(),
    aceitouTermos: z.boolean().refine(Boolean, 'Você deve aceitar os termos'),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })

type FormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { success, error: showError } = useToast()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: FormData) {
    try {
      const result = await authRegister({
        email: data.email,
        senha: data.senha,
        nomeCompleto: data.nomeCompleto,
        aceitouTermos: data.aceitouTermos,
      })

      if (result.token) {
        login(result.token, false)
        success('Conta criada!', 'Bem-vinda à Plural.')
        setTimeout(() => navigate('/dashboard', { replace: true }), 800)
      } else {
        success('Conta criada!', result.message || 'Faça login para continuar.')
        setTimeout(() => navigate('/login', { replace: true }), 1200)
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      showError('Erro no cadastro', msg)
    }
  }

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center bg-background p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-md pt-8 md:pt-0"
        >
          <div className="flex items-center gap-2.5 mb-8">
            <img src="/favicon.png" alt="" aria-hidden className="h-8 w-8 object-contain" />
            <div className="leading-none">
              <span className="text-primary font-black text-xl tracking-tight block">Plural</span>
              <span className="text-muted-foreground text-[9px] font-semibold tracking-widest uppercase">Plataforma</span>
            </div>
          </div>

          <h1 className="text-3xl font-black text-foreground mb-1">Criar conta</h1>
          <p className="text-muted-foreground mb-8">Comece a usar a plataforma hoje</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Nome completo"
              type="text"
              placeholder="Seu nome"
              autoComplete="name"
              leftIcon={<User size={16} />}
              error={errors.nomeCompleto?.message}
              {...register('nomeCompleto')}
            />

            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              leftIcon={<Envelope size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer hover:text-primary transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.senha?.message}
              {...register('senha')}
            />

            <Input
              label="Confirmar senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repita a senha"
              autoComplete="new-password"
              leftIcon={<Lock size={16} />}
              error={errors.confirmarSenha?.message}
              {...register('confirmarSenha')}
            />

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary cursor-pointer"
                {...register('aceitouTermos')}
              />
              <span className="text-sm text-muted-foreground leading-relaxed">
                Li e aceito os{' '}
                <a href="/privacy" target="_blank" className="text-primary font-semibold hover:underline">
                  termos de uso e política de privacidade
                </a>
              </span>
            </label>
            {errors.aceitouTermos && (
              <p className="text-xs text-danger font-medium">{errors.aceitouTermos.message}</p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              Criar conta
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </motion.div>
      </div>
  )
}
