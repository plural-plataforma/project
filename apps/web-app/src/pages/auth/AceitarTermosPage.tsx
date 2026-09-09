import { useState } from 'react'
import { useTermosPendentes } from '@/hooks/useTermosPendentes'

interface AceitarTermosPageProps {
  onAceito: () => void
}

export default function AceitarTermosPage({ onAceito }: AceitarTermosPageProps) {
  const { pendentes, isLoading, isError, aceitar, aceitando } = useTermosPendentes(true)
  const [erro, setErro] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 text-center">
          <p className="text-sm text-destructive mb-4">
            Não foi possível carregar os termos de uso. Tente novamente.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-primary-foreground rounded-md py-2.5 font-medium"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const termoAtual = pendentes[0]

  if (!termoAtual) {
    onAceito()
    return null
  }

  const handleAceitar = async () => {
    setErro(null)
    try {
      await aceitar(termoAtual.termoVersaoId)
      if (pendentes.length <= 1) onAceito()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao aceitar o termo. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full bg-card rounded-lg shadow-lg p-6 md:p-8">
        <h1 className="text-xl font-bold mb-4">{termoAtual.nome}</h1>
        <div
          className="prose max-w-none text-sm text-muted-foreground max-h-[50vh] overflow-y-auto mb-6"
          dangerouslySetInnerHTML={{ __html: termoAtual.texto }}
        />
        {erro && <p className="text-sm text-destructive mb-4">{erro}</p>}
        <button
          type="button"
          onClick={handleAceitar}
          disabled={aceitando}
          className="w-full bg-primary text-primary-foreground rounded-md py-2.5 font-medium disabled:opacity-60"
        >
          {aceitando ? 'Salvando...' : 'Aceitar e continuar'}
        </button>
      </div>
    </div>
  )
}
