import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material'
import promptsIAService, { type PromptSistemaIA } from '../../services/promptsIAService'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'

const ROTULOS: Record<string, string> = {
  EstudoCaso: 'Estudo de Caso',
  PAEE: 'Plano de AEE (PAEE)',
  AvaliacaoDiagnostica: 'Avaliação Diagnóstica',
  RelatoAtendimento: 'Relato de Atendimento',
}

function PromptCard({ prompt }: { prompt: PromptSistemaIA }) {
  const queryClient = useQueryClient()
  const [conteudo, setConteudo] = useState(prompt.conteudo)
  const [showSuccess, setShowSuccess] = useState(false)

  const salvarMutation = useMutation({
    mutationFn: () => promptsIAService.atualizar(prompt.tipoDocumento, conteudo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts-ia'] })
      setShowSuccess(true)
      window.setTimeout(() => setShowSuccess(false), 3000)
    },
  })

  const alterado = conteudo !== prompt.conteudo

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        {ROTULOS[prompt.tipoDocumento] ?? prompt.tipoDocumento}
      </Typography>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Prompt salvo com sucesso.
        </Alert>
      )}

      {salvarMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(salvarMutation.error as Error).message}
        </Alert>
      )}

      <textarea
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        rows={10}
        style={{
          width: '100%',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          resize: 'vertical',
        }}
      />

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button
          variant="contained"
          disabled={!alterado || salvarMutation.isPending}
          onClick={() => salvarMutation.mutate()}
        >
          {salvarMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </Stack>
    </Paper>
  )
}

export default function PromptsIA() {
  const { data: prompts = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['prompts-ia'],
    queryFn: () => promptsIAService.listar(),
  })

  const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar os prompts de IA.'

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Regras que a IA segue ao gerar cada tipo de documento. Alterações aqui valem imediatamente,
        sem precisar de deploy.
      </Typography>

      {isLoading && <LoadingState variant="cards" />}
      {isError && <ErrorState message={errorMessage} onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <Stack spacing={3}>
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </Stack>
      )}
    </Box>
  )
}
