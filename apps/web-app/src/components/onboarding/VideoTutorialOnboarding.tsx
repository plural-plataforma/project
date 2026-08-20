import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useOnboardingStore } from '@/stores/onboardingStore'

const TUTORIAL_VIDEO_ID = '2xUmseaj7XQ'
const TUTORIAL_EMBED_URL = `https://www.youtube-nocookie.com/embed/${TUTORIAL_VIDEO_ID}?rel=0&modestbranding=1`

interface VideoTutorialOnboardingProps {
  isLoggedIn?: boolean
}

export function VideoTutorialOnboarding({ isLoggedIn: isLoggedInProp }: VideoTutorialOnboardingProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn: isLoggedInFromAuth } = useAuth()
  const setHasSeenOnboarding = useOnboardingStore((s) => s.setHasSeenOnboarding)
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding)

  const isLoggedIn = isLoggedInProp ?? isLoggedInFromAuth
  const isReviewMode = hasSeenOnboarding
  const destination = isLoggedIn
    ? ((location.state as { destination?: string } | null)?.destination ?? '/dashboard')
    : '/login'

  const handleFinish = useCallback(() => {
    if (!isReviewMode) setHasSeenOnboarding(true)
    navigate(isReviewMode ? '/login' : destination, { replace: true })
  }, [isReviewMode, setHasSeenOnboarding, navigate, destination])

  return (
    <Dialog open onOpenChange={(open) => !open && handleFinish()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-2xl font-black">Bem-vinda à Plural!</DialogTitle>
          <DialogDescription className="text-base">
            Preparamos um vídeo rápido para apresentar a plataforma e mostrar como elaborar seus
            documentos de forma prática utilizando todos os recursos da Plural.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-video">
          <iframe
            src={TUTORIAL_EMBED_URL}
            title="Tutorial de uso da Plural Plataforma"
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        <div className="flex flex-col gap-3">
          {isReviewMode ? (
            <Button variant="outline" size="lg" className="w-full" onClick={handleFinish}>
              Voltar
            </Button>
          ) : (
            <>
              <Button size="lg" className="w-full" onClick={handleFinish}>
                {isLoggedIn ? 'Começar a utilizar a plataforma' : 'Entrar na plataforma'}
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={handleFinish}>
                Assistir depois
              </Button>
              {!isLoggedIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    setHasSeenOnboarding(true)
                    navigate('/cadastro', { replace: true })
                  }}
                >
                  Criar conta
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
