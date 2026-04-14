import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Eye, EyeSlash, Lock, Envelope, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { authLogin, getErrorMessage, useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/useToast'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
})

type FormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding)
  const { error: showError } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: FormData) {
    setSubmitError(null)
    try {
      const result = await authLogin(data)
      if (result.token) {
        setIsLoggingIn(true)
        const destination = result.precisaTrocarSenha ? '/alterar-senha' : '/dashboard'
        // Delay intencional: imersão de marca, familiaridade, transição suave
        const LOADING_IMMERSION_MS = 2200
        setTimeout(() => {
          login(result.token!, result.precisaTrocarSenha ?? false)
          navigate(destination, { replace: true })
        }, LOADING_IMMERSION_MS)
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      setSubmitError(msg)
      showError('Erro ao entrar', msg)
    }
  }

  return (
    <>
      <LoadingScreen visible={isLoggingIn} message="Bem-vinda à Plural" />

      <div className="min-h-screen flex bg-background">

      {/* ─── Painel esquerdo — identidade visual ─── */}
      <motion.div
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="hidden lg:flex flex-col w-[480px] shrink-0 bg-primary relative overflow-hidden"
      >
        {/* Blobs decorativos de fundo */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-amber/10 blur-3xl" />

        {/* Conteúdo */}
        <div className="relative flex flex-col h-full p-10 justify-between">

          {/* Logo topo — mark (favicon) + texto branco */}
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              {/* Halo de blur atrás do mark para destacar do fundo teal */}
              <div className="absolute inset-0 scale-125 rounded-full bg-white/20 blur-md" />
              <img src="/favicon.png" alt="" aria-hidden className="relative h-8 w-8 object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-black text-lg tracking-tight">Plural</span>
              <span className="text-white/50 text-[9px] font-semibold tracking-widest uppercase">Plataforma</span>
            </div>
          </div>

          {/* Hero central — splash-icon (logo principal) com container claro */}
          <div className="flex flex-col items-center text-center gap-6">
            <motion.div
              className="rounded-3xl overflow-hidden shadow-elevated"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }}
            >
              <img
                src="/splash-icon.png"
                alt="Plural Plataforma"
                className="w-44 h-44 object-cover"
              />
            </motion.div>
            <div>
              <h2 className="text-3xl font-black text-white leading-snug">
                Acompanhamento<br />pedagógico
              </h2>
              <p className="text-white/60 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
                Gerencie alunos, planejamentos e avaliações diagnósticas com eficiência e cuidado.
              </p>
            </div>
          </div>

          {/* Stats + versão — rodapé */}
          <div className="flex items-end justify-between">
            <div className="flex gap-8">
              {[
                { num: '3', label: 'Módulos integrados' },
                { num: '100%', label: 'Focado no professor' },
              ].map(({ num, label }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-amber font-black text-2xl">{num}</span>
                  <span className="text-white/50 text-xs font-medium">{label}</span>
                </div>
              ))}
            </div>
            <span className="text-white/30 text-[10px] font-mono tabular-nums">
              v{__APP_VERSION__}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── Painel direito — formulário ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 flex items-start lg:items-center justify-center p-6 overflow-y-auto min-h-screen"
      >
        <div className="w-full max-w-sm pt-8 lg:pt-0">

          {/* Logo mobile */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <img src="/favicon.png" alt="" aria-hidden className="h-8 w-8 object-contain" />
            <div className="leading-none">
              <span className="text-primary font-black text-xl tracking-tight block">Plural</span>
              <span className="text-muted-foreground text-[9px] font-semibold tracking-widest uppercase">Plataforma</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <h1 className="text-2xl font-black text-foreground mb-1">
              {hasSeenOnboarding ? 'Bem-vinda de volta' : 'Bem-vinda'}
            </h1>
            <p className="text-muted-foreground text-sm mb-8">Acesse sua conta para continuar</p>

            {submitError && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
              >
                <WarningCircle size={18} weight="fill" className="shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                placeholder="••••••••"
                autoComplete="current-password"
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

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={isSubmitting}
              >
                Entrar
              </Button>
            </form>

            {/* <p className="text-center text-sm text-muted-foreground mt-6">
              Não tem conta?{' '}
              <Link to="/cadastro" className="text-primary font-semibold hover:underline">
                Criar conta
              </Link>
            </p> */}
            {hasSeenOnboarding && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                <Link to="/onboarding" className="hover:text-primary transition-colors">
                  Rever apresentação
                </Link>
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
    </>
  )
}
