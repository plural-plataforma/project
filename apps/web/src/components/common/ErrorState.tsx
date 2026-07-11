import { Alert, AlertTitle, Button, Box } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

/**
 * Estado de erro padronizado, com ação de tentar novamente quando a tela
 * expõe um refetch (TanStack Query já fornece isso via `refetch`).
 */
export default function ErrorState({
  title = 'Não foi possível carregar os dados',
  message = 'Ocorreu um erro ao buscar as informações. Tente novamente em alguns instantes.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Box sx={{ m: 3 }}>
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
              Tentar novamente
            </Button>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  )
}
