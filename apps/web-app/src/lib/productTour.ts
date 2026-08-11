import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

const steps: DriveStep[] = [
  {
    element: '#tour-sidebar-brand',
    popover: {
      title: 'Bem-vinda à Plural!',
      description: 'Vamos fazer um tour rápido pela plataforma antes de você começar.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-sidebar-nav',
    popover: {
      title: 'Fluxo pedagógico',
      description:
        'Aqui fica todo o fluxo do atendimento: Escola, Alunos, Estudo de Caso, Avaliação, PAEE e Relatos, nessa ordem, além da Documentação Pedagógica e da Biblioteca de Modelos.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-sidebar-profile',
    popover: {
      title: 'Perfil e tema',
      description: 'Seu perfil, o tema claro/escuro e o botão de sair ficam aqui embaixo.',
      side: 'right',
      align: 'end',
    },
  },
  {
    element: '#tour-hero',
    popover: {
      title: 'Sua jornada',
      description: 'Acompanhe aqui o progresso da sua jornada pedagógica na plataforma.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-metrics',
    popover: {
      title: 'Resumo rápido',
      description: 'Esses cartões trazem um resumo dos seus números. Clique em qualquer um para ver mais detalhes.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-journey',
    popover: {
      title: 'Jornada pedagógica',
      description: 'Siga essa lista passo a passo: ela te guia pelas etapas do atendimento, da escola até o relato final.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#tour-insights',
    popover: {
      title: 'Insights para você',
      description: 'Fique de olho nos alertas e sugestões personalizadas com base nos seus dados.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '#tour-recent',
    popover: {
      title: 'Atividade recente',
      description: 'Seus últimos registros aparecem aqui. Pronto, agora é só começar!',
      side: 'left',
      align: 'start',
    },
  },
]

let isTourActive = false

export function startProductTour(onFinish: () => void) {
  if (isTourActive) return
  isTourActive = true

  const tourDriver = driver({
    showProgress: true,
    allowClose: true,
    smoothScroll: true,
    overlayOpacity: 0.6,
    popoverClass: 'plural-tour',
    nextBtnText: 'Próximo',
    prevBtnText: 'Voltar',
    doneBtnText: 'Concluir',
    progressText: '{{current}} de {{total}}',
    steps,
    onDestroyed: () => {
      isTourActive = false
      onFinish()
    },
  })

  tourDriver.drive()
}
