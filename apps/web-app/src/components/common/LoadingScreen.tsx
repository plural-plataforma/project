import { motion, AnimatePresence } from 'framer-motion'

interface LoadingScreenProps {
  /** Exibe a tela apenas quando `true` */
  visible?: boolean
  /** Mensagem exibida abaixo do logo (ex: "Salvando avaliação...") */
  message?: string
  /** Quando `true` ocupa a tela toda (overlay); quando `false`, ocupa o contêiner pai */
  fullscreen?: boolean
}

/**
 * Tela de carregamento com identidade visual Plural.
 * Uso: transações lentas (submit de wizard, upload, etc.)
 *
 * @example
 * <LoadingScreen visible={isPending} message="Criando avaliação..." />
 */
export function LoadingScreen({
  visible = true,
  message,
  fullscreen = true,
}: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={
            fullscreen
              ? 'fixed inset-0 z-[300] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm'
              : 'flex flex-col items-center justify-center py-20'
          }
          aria-live="assertive"
          aria-label={message ?? 'Carregando'}
        >
          {/* Logo animado */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mb-8"
          >
            <img
              src="/favicon.png"
              alt="Plural Plataforma"
              className="w-20 h-20 object-contain"
              draggable={false}
            />
          </motion.div>

          {/* Spinner com cores da marca */}
          <motion.div
            className="relative h-12 w-12 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {/* Anel externo — amber */}
            <motion.span
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
            />
            {/* Anel interno — primary */}
            <motion.span
              className="absolute inset-[6px] rounded-full border-4 border-transparent border-t-primary"
              animate={{ rotate: -360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>

          {/* Mensagem */}
          <AnimatePresence mode="wait">
            {message && (
              <motion.p
                key={message}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-sm font-semibold text-muted-foreground text-center max-w-xs"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Versão inline (sem overlay) — para seções da página */
export function InlineLoader({ message }: { message?: string }) {
  return <LoadingScreen visible fullscreen={false} message={message} />
}
