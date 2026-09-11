import { motion } from 'framer-motion'
import { FileText, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { useTermosPendentes } from '@/hooks/useTermosPendentes'
import { useToast } from '@/hooks/useToast'

interface AceitarTermosPageProps {
  onAceito: () => void
}

export default function AceitarTermosPage({ onAceito }: AceitarTermosPageProps) {
  const { pendentes, isLoading, isError, aceitar, aceitando } = useTermosPendentes(true)
  const { error: showError } = useToast()

  if (isLoading) {
    return <LoadingScreen message="Carregando termos de uso..." />
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm text-center"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-danger-light flex items-center justify-center">
              <WarningCircle size={32} className="text-danger" weight="duotone" />
            </div>
          </div>
          <h1 className="text-xl font-black text-foreground mb-1">Não foi possível carregar</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Tivemos um problema ao carregar os termos de uso. Verifique sua conexão e tente novamente.
          </p>
          <Button size="lg" className="w-full" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </motion.div>
      </div>
    )
  }

  const termoAtual = pendentes[0]

  if (!termoAtual) {
    onAceito()
    return null
  }

  const handleAceitar = async () => {
    try {
      await aceitar(termoAtual.termoVersaoId)
      if (pendentes.length <= 1) onAceito()
    } catch (err) {
      showError('Erro', err instanceof Error ? err.message : 'Erro ao aceitar o termo. Tente novamente.')
    }
  }

  return (
    <div className="relative min-h-screen flex items-start md:items-center justify-center bg-background p-6 overflow-y-auto overflow-x-hidden">
      {/* Blobs decorativos — mesma identidade visual do painel de login */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-amber/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-8 w-48 h-48 rounded-full bg-brand-purple/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-xl pt-8 md:pt-0"
      >
        {/* Logo — reforça de quem é o termo que a usuária está lendo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src="/favicon.png" alt="" aria-hidden className="h-7 w-7 object-contain" />
          <div className="leading-none">
            <span className="text-primary font-black text-base tracking-tight block">Plural</span>
            <span className="text-brand-purple text-[8px] font-semibold tracking-widest uppercase">Plataforma</span>
          </div>
        </div>

        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-primary-light flex items-center justify-center">
            <FileText size={32} className="text-primary" weight="duotone" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-foreground text-center mb-1">{termoAtual.nome}</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Leia com atenção antes de continuar usando a plataforma.
        </p>

        <Card className="mb-6 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-amber to-brand-purple" />
          <CardContent
            className="prose prose-sm max-w-none text-foreground/80 leading-relaxed max-h-[45vh] overflow-y-auto pt-5"
            dangerouslySetInnerHTML={{ __html: termoAtual.texto }}
          />
        </Card>

        <Button size="lg" className="w-full" loading={aceitando} onClick={handleAceitar}>
          Aceitar e continuar
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Versão {termoAtual.versao} · {termoAtual.nome}
        </p>
      </motion.div>
    </div>
  )
}
