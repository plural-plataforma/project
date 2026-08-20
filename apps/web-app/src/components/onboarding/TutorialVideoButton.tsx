import { useEffect, useState } from 'react'
import { Play } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TutorialVideoFrame } from '@/components/onboarding/TutorialVideoFrame'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { cn } from '@/lib/utils'

const DURACAO_TEXTO_INICIAL_MS = 10_000

export function TutorialVideoButton() {
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding)
  const [aberto, setAberto] = useState(false)
  const [textoInicialVisivel, setTextoInicialVisivel] = useState(true)

  // O rótulo aparece por alguns segundos e recolhe; depois disso só volta no hover/foco
  useEffect(() => {
    const timeoutId = setTimeout(() => setTextoInicialVisivel(false), DURACAO_TEXTO_INICIAL_MS)
    return () => clearTimeout(timeoutId)
  }, [])

  // Só aparece depois que a professora passou pelo tutorial inicial
  if (!hasSeenOnboarding) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Rever tutorial em vídeo"
        className="group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex items-center justify-center rounded-full bg-primary p-3.5 text-white shadow-elevated transition-colors hover:bg-primary/90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:right-6 md:bottom-6"
      >
        {/* 1px pra direita: triângulo do Play fica opticamente centrado no círculo */}
        <Play size={20} weight="fill" className="shrink-0 translate-x-[1px]" />
        <span
          aria-hidden
          className={cn(
            'grid transition-all duration-300 ease-out motion-reduce:transition-none',
            'group-hover:ml-2 group-hover:grid-cols-[1fr] group-hover:opacity-100',
            'group-focus-visible:ml-2 group-focus-visible:grid-cols-[1fr] group-focus-visible:opacity-100',
            textoInicialVisivel
              ? 'ml-2 grid-cols-[1fr] opacity-100'
              : 'ml-0 grid-cols-[0fr] opacity-0'
          )}
        >
          <span className="overflow-hidden whitespace-nowrap text-sm font-semibold">
            Rever tutorial
          </span>
        </span>
      </button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tutorial da Plural</DialogTitle>
            <DialogDescription>
              Vídeo de apresentação da plataforma e de como elaborar seus documentos.
            </DialogDescription>
          </DialogHeader>

          <TutorialVideoFrame />
        </DialogContent>
      </Dialog>
    </>
  )
}
