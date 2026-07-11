import { Box, Skeleton, Stack } from '@mui/material'

interface LoadingStateProps {
  /** Quantidade de linhas de skeleton (tabela) ou cards a exibir. */
  rows?: number
  variant?: 'table' | 'cards' | 'inline'
}

/**
 * Estado de carregamento padronizado. Usar no lugar de <CircularProgress />
 * isolado sempre que a tela tiver uma estrutura de tabela ou cards conhecida,
 * para evitar "salto" de layout quando os dados chegam.
 */
export default function LoadingState({ rows = 5, variant = 'table' }: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <Skeleton variant="circular" width={32} height={32} />
      </Box>
    )
  }

  if (variant === 'cards') {
    return (
      <Stack direction="row" spacing={2} sx={{ py: 2, flexWrap: 'wrap' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width={220} height={120} />
        ))}
      </Stack>
    )
  }

  return (
    <Stack spacing={1.5} sx={{ p: 3 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={48} />
      ))}
    </Stack>
  )
}
