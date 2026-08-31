import { Headset, WhatsappLogo } from '@phosphor-icons/react'

const NUMERO_WHATSAPP_SUPORTE = '555381306116'

export function SupportWhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${NUMERO_WHATSAPP_SUPORTE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com o suporte pelo WhatsApp"
      className="fixed left-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary text-white shadow-elevated transition-colors hover:bg-primary/90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:left-6 md:bottom-6"
    >
      <Headset size={24} weight="fill" />
      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] ring-2 ring-white">
        <WhatsappLogo size={13} weight="fill" className="text-white" />
      </span>
    </a>
  )
}
