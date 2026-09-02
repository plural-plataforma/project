import { Headset, WhatsappLogo } from '@phosphor-icons/react'

const NUMERO_WHATSAPP_SUPORTE = '555381306116'

export function SupportWhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${NUMERO_WHATSAPP_SUPORTE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com o suporte pelo WhatsApp"
      className="fixed right-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4rem)] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-elevated transition-colors hover:bg-primary/90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:right-6 md:bottom-[5.5rem]"
    >
      <Headset size={26} weight="fill" />
      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366] ring-2 ring-white">
        <WhatsappLogo size={14} weight="fill" className="text-white" />
      </span>
    </a>
  )
}
