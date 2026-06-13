import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkle } from '@phosphor-icons/react'

// ─── Constantes ─────────────────────────────────────────────────────────────

const ESTUDO_CASO_SECTIONS = [
  '1. Identificação do(a) estudante',
  '2. Levantamento das barreiras e potencialidades',
  '3. Avaliação pedagógica e funcional',
  '4. Definição das necessidades educacionais específicas',
  '5. Planejamento das ações do AEE',
]

const STATUS_MESSAGES = [
  'Analisando os dados do estudante…',
  'Estruturando as seções do documento…',
  'Organizando as necessidades identificadas…',
  'Revisando o conteúdo pedagógico…',
  'Finalizando o rascunho…',
]

const SKELETON_ROWS: number[][] = [
  [88, 72, 60],
  [92, 80, 68, 74],
  [75, 88, 64],
  [90, 70, 82, 58],
  [84, 92, 68, 76],
]

// ─── Componente público: inline ──────────────────────────────────────────────

interface DocGeracaoAnimationProps {
  isGenerating: boolean
  children?: React.ReactNode
  sections?: string[]
  minHeight?: string
}

/**
 * Envolve a área de preview/texto de um documento.
 * Mostra a animação de geração IA enquanto `isGenerating=true`
 * e revela `children` com transição suave ao concluir.
 */
export function DocGeracaoAnimation({
  isGenerating,
  children,
  sections = ESTUDO_CASO_SECTIONS,
  minHeight = '380px',
}: DocGeracaoAnimationProps) {
  const statusText = useCyclingStatus(isGenerating)

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border">
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="gerando"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.2 }}
            className="bg-muted/40 overflow-hidden"
            style={{ minHeight }}
            aria-live="polite"
            aria-label="Plural IA gerando documento"
          >
            {/* Barra de topo: identidade IA */}
            <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <PluralAiBadge />
                <motion.span
                  key={statusText}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs text-muted-foreground"
                >
                  {statusText}
                </motion.span>
              </div>
              <TypingDots />
            </div>

            {/* Barra de progresso falsa */}
            <div className="h-0.5 bg-border/40 overflow-hidden">
              <motion.div
                className="h-full bg-primary/60 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '90%' }}
                transition={{ duration: 9, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </div>

            <div className="p-4 space-y-4">
              {/* Esqueleto do cabeçalho do doc */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="space-y-2"
              >
                <AnimatedBar width={52} height={14} delay={0.2} />
                <AnimatedBar width={38} height={10} delay={0.35} dim />
                <AnimatedBar width={70} height={9} delay={0.45} dim />
              </motion.div>

              {/* Seções do documento */}
              {sections.map((section, si) => (
                <motion.div
                  key={section}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + si * 0.5, duration: 0.35, ease: 'easeOut' }}
                  className="space-y-1.5"
                >
                  {/* Título da seção */}
                  <AnimatedBar width={22 + si * 9} height={11} delay={0.55 + si * 0.5} accent />
                  {/* Linhas do corpo */}
                  {(SKELETON_ROWS[si] ?? SKELETON_ROWS[0]).map((w, li) => (
                    <AnimatedBar key={li} width={w} height={9} delay={0.65 + si * 0.5 + li * 0.1} dim />
                  ))}
                </motion.div>
              ))}

              {/* Cursor piscante */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                className="flex items-center gap-1 pt-1"
              >
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
                  className="inline-block h-4 w-0.5 rounded-full bg-primary"
                />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="conteudo"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Componente público: fullscreen ──────────────────────────────────────────

interface DocGeracaoLoadingScreenProps {
  visible: boolean
  sections?: string[]
}

/**
 * Overlay fullscreen estilo "Plural IA gerando documento".
 * Substitui o LoadingScreen genérico em fluxos de geração de documentos.
 */
export function DocGeracaoLoadingScreen({
  visible,
  sections = ESTUDO_CASO_SECTIONS,
}: DocGeracaoLoadingScreenProps) {
  const statusText = useCyclingStatus(visible)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="doc-loading-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-300 flex flex-col items-center justify-center bg-background/97 backdrop-blur-sm px-5"
          aria-live="assertive"
          aria-label="Plural IA gerando documento"
        >
          <div className="w-full max-w-sm space-y-5">

            {/* Ícone animado + identidade */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center gap-3"
            >
              <AiDocumentIcon />

              <div className="flex flex-col items-center gap-1.5">
                <PluralAiBadge large />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={statusText}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-muted-foreground text-center"
                  >
                    {statusText}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Barra de progresso */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-1"
            >
              <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: '90%' }}
                  transition={{ duration: 9, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>
            </motion.div>

            {/* Preview do documento sendo gerado */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
            >
              {/* Cabeçalho do card-doc */}
              <div className="border-b border-border/60 px-4 py-3 space-y-2">
                <AnimatedBar width={55} height={12} delay={0.5} />
                <AnimatedBar width={40} height={9} delay={0.6} dim />
                <AnimatedBar width={72} height={8} delay={0.7} dim />
              </div>

              <div className="p-4 space-y-3">
                {sections.map((section, si) => (
                  <motion.div
                    key={section}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + si * 0.45, duration: 0.3, ease: 'easeOut' }}
                    className="space-y-1.5"
                  >
                    <AnimatedBar width={20 + si * 10} height={10} delay={0.65 + si * 0.45} accent />
                    {(SKELETON_ROWS[si] ?? SKELETON_ROWS[0]).slice(0, 2).map((w, li) => (
                      <AnimatedBar key={li} width={w} height={8} delay={0.72 + si * 0.45 + li * 0.08} dim />
                    ))}
                  </motion.div>
                ))}

                {/* Cursor final */}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ delay: 3, duration: 0.85, repeat: Infinity }}
                  className="inline-block h-3.5 w-0.5 rounded-full bg-primary"
                />
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Internos ────────────────────────────────────────────────────────────────

/** Badge "✦ Plural IA" com ícone animado */
function PluralAiBadge({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 font-semibold text-primary ${
        large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
      }`}
    >
      <motion.div
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Sparkle size={large ? 13 : 10} weight="fill" />
      </motion.div>
      Plural IA
    </span>
  )
}

/** SVG animado de documento sendo escrito pela IA */
function AiDocumentIcon() {
  const lines = [
    { y: 26, width: 20, delay: 0.4 },
    { y: 31, width: 15, delay: 0.8 },
    { y: 36, width: 18, delay: 1.2 },
    { y: 41, width: 13, delay: 1.6 },
  ]

  return (
    <div className="relative">
      {/* Glow de fundo */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <svg
        width="72"
        height="80"
        viewBox="0 0 56 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative"
      >
        {/* Sombra do doc */}
        <motion.rect
          x="13" y="10" width="32" height="44" rx="4"
          className="fill-primary/8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        />
        {/* Corpo do documento */}
        <motion.rect
          x="10" y="7" width="32" height="44" rx="4"
          className="fill-background stroke-primary"
          strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: 'center' }}
        />
        {/* Dobra no canto */}
        <motion.path
          d="M31 7 L42 18"
          className="stroke-primary"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        />
        <motion.path
          d="M31 7 L31 18 L42 18"
          className="fill-primary/15"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        />
        {/* Linhas animadas de texto */}
        {lines.map((line, i) => (
          <motion.rect
            key={i}
            x="16"
            y={line.y - 1}
            height="2.5"
            rx="1.25"
            className="fill-primary/50"
            initial={{ width: 0 }}
            animate={{ width: line.width }}
            transition={{ delay: line.delay, duration: 0.55, ease: 'easeOut' }}
          />
        ))}
        {/* Cursor piscante */}
        <motion.rect
          x="29.5" y="40" width="1.5" height="4" rx="0.75"
          className="fill-primary"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ delay: 2, duration: 0.85, repeat: Infinity }}
        />
        {/* Sparkle superior */}
        <motion.circle
          cx="47" cy="11" r="3.5"
          className="fill-amber"
          animate={{ scale: [1, 1.35, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="47" cy="11" r="1.5"
          fill="white"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
        />
      </svg>
    </div>
  )
}

/** Barra de skeleton com animação de crescimento horizontal */
function AnimatedBar({
  width,
  height,
  delay,
  accent,
  dim,
}: {
  width: number
  height: number
  delay: number
  accent?: boolean
  dim?: boolean
}) {
  return (
    <motion.div
      className={`rounded-full ${
        accent ? 'bg-primary/35' : dim ? 'bg-muted-foreground/18 animate-pulse' : 'bg-muted-foreground/25 animate-pulse'
      }`}
      style={{ height, maxWidth: '100%' }}
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: `${width}%`, opacity: 1 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    />
  )
}

/** Três pontinhos pulsando */
function TypingDots() {
  return (
    <span className="flex gap-0.5 items-center">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 w-1 rounded-full bg-primary"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

/** Hook que cicla o texto de status enquanto `active=true` */
function useCyclingStatus(active: boolean): string {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!active) {
      setIdx(0)
      return
    }
    const t = setInterval(() => setIdx((p) => (p + 1) % STATUS_MESSAGES.length), 2600)
    return () => clearInterval(t)
  }, [active])

  return STATUS_MESSAGES[idx]
}
