import { Sparkle } from '@phosphor-icons/react'
import { ListNoticeBanner } from '@/components/lists/ListNoticeBanner'
import { useLimiteUsoIA } from '@/hooks/useLimiteUsoIA'

interface AvisoLimiteUsoIAProps {
  className?: string
}

/**
 * Aviso de uso de IA ao lado das ações de geração. Limite diário bloqueia (a API recusa);
 * o mensal é só informativo. Não renderiza nada abaixo dos limites.
 */
export function AvisoLimiteUsoIA({ className }: AvisoLimiteUsoIAProps) {
  const { limite } = useLimiteUsoIA()
  if (!limite) return null

  if (limite.limiteDiarioAtingido) {
    return (
      <ListNoticeBanner
        icon={<Sparkle size={18} weight="duotone" />}
        title="Limite diário de geração com IA atingido"
        className={className}
      >
        Você já fez {limite.usoHoje} gerações com IA hoje (limite de {limite.limiteDiario} por dia). A geração
        volta a ficar disponível amanhã.
      </ListNoticeBanner>
    )
  }

  if (limite.limiteMensalAtingido) {
    return (
      <ListNoticeBanner
        icon={<Sparkle size={18} weight="duotone" />}
        title="Uso de IA acima do previsto este mês"
        variant="default"
        className={className}
      >
        Você já fez {limite.usoMes} gerações com IA este mês (referência de {limite.limiteMensal}). Você pode
        continuar usando normalmente.
      </ListNoticeBanner>
    )
  }

  return null
}
