import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useQuery } from '@tanstack/react-query'
import { buscarProfessor } from '@/services/professorService'
import { TutorialVideoButton } from '@/components/onboarding/TutorialVideoButton'
import { SupportWhatsAppButton } from '@/components/common/SupportWhatsAppButton'

export function AppShell() {
  const { data } = useQuery({
    queryKey: ['professor'],
    queryFn: buscarProfessor,
    staleTime: 1000 * 60 * 5,
  })

  const professorNome = data?.objeto?.nomeCompleto

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar professorNome={professorNome} />
      <main className="flex-1 md:pl-0 pt-14 md:pt-0 min-h-screen overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
      <TutorialVideoButton />
      <SupportWhatsAppButton />
    </div>
  )
}
