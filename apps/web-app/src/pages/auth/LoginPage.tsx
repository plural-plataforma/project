import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Eye, EyeSlash, Lock, Envelope, WarningCircle, WifiSlash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { authLogin, useAuth } from '@/context/AuthContext'
import { getApiErrorFeedback, formatFriendlyErrorBody } from '@/lib/apiFriendlyError'
import { getSavedCredential, storeSavedCredential } from '@/lib/credentialManager'
import { useToast } from '@/hooks/useToast'
import { PEDAGOGICAL_FLOW_STEP_COUNT, PLATFORM_FEATURE_COUNT } from '@/config/pedagogicalFlow'

const LOGIN_STATS = [
  { num: String(PLATFORM_FEATURE_COUNT), label: 'Funcionalidades da plataforma' },
  { num: String(PEDAGOGICAL_FLOW_STEP_COUNT), label: 'Etapas da jornada PAEE' },
  { num: '2', label: 'Exportação PDF e Word' },
] as const

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
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(loginSchema) })

  // Preenche com credencial salva pelo navegador, quando disponível
  useEffect(() => {
    getSavedCredential().then((credential) => {
      if (credential) {
        setValue('email', credential.id)
        setValue('senha', credential.password)
      }
    })
  }, [setValue])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function onSubmit(data: FormData) {
    setSubmitError(null)
    try {
      const result = await authLogin(data)
      if (result.token) {
        await storeSavedCredential(data.email, data.senha)
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
      const fb = getApiErrorFeedback(err)
      const body = formatFriendlyErrorBody(fb)
      setSubmitError(body)
      showError(fb.title, body)
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
        <div className="absolute top-1/3 right-8 w-48 h-48 rounded-full bg-brand-purple/20 blur-3xl" />

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
              <span className="text-brand-purple/90 text-[9px] font-semibold tracking-widest uppercase">Plataforma</span>
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
          <div className="space-y-5 border-t border-white/10 pt-6">
            <div className="grid grid-cols-3 gap-4">
              {LOGIN_STATS.map(({ num, label }) => (
                <div key={label} className="flex flex-col gap-1 min-w-0">
                  <span className="text-amber font-black text-3xl tabular-nums leading-none">{num}</span>
                  <span className="text-white/55 text-[11px] font-medium leading-snug">{label}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/75 tabular-nums tracking-wide">
                v{__APP_VERSION__}
              </span>
            </div>
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
            <div className="leading-none flex-1">
              <span className="text-primary font-black text-xl tracking-tight block">Plural</span>
              <span className="text-brand-purple text-[9px] font-semibold tracking-widest uppercase">Plataforma</span>
            </div>
            <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-brand-purple tabular-nums">
              v{__APP_VERSION__}
            </span>
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

            {!isOnline && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber-foreground"
              >
                <WifiSlash size={18} weight="fill" className="shrink-0 mt-0.5" />
                <span className="leading-snug">Você está offline. Verifique sua conexão para entrar.</span>
              </div>
            )}

            {submitError && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
              >
                <WarningCircle size={18} weight="fill" className="shrink-0 mt-0.5" />
                <span className="whitespace-pre-line leading-snug">{submitError}</span>
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
                disabled={isSubmitting}
                {...register('email')}
              />

              <div className="space-y-1.5">
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
                  disabled={isSubmitting}
                  onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                  onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                  {...register('senha')}
                />
                {capsLockOn && (
                  <p className="flex items-center gap-1 text-xs text-amber font-medium">
                    <WarningCircle size={14} weight="fill" />
                    Caps Lock ativado
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={isSubmitting}
                disabled={!isOnline}
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
