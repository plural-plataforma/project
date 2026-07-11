import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material'
import configuracoesService, { LinksWhatsApp } from '../../services/configuracoesService'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'

const URL_REGEX = /^https?:\/\/.+/i

export default function ConfiguracoesGerais() {
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<LinksWhatsApp>({
    morganaWhatsappUrl: '',
    pluralWhatsappUrl: '',
  })
  const [validationError, setValidationError] = useState<string | null>(null)

  const {
    data: links,
    isLoading,
    isError,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: ['links-whatsapp'],
    queryFn: () => configuracoesService.getLinksWhatsApp(),
  })

  useEffect(() => {
    if (links) {
      setFormData(links)
    }
  }, [links])

  const updateMutation = useMutation({
    mutationFn: (data: LinksWhatsApp) => configuracoesService.updateLinksWhatsApp(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['links-whatsapp'], data)
    },
  })

  const handleChange = (field: keyof LinksWhatsApp, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (!URL_REGEX.test(formData.morganaWhatsappUrl.trim())) {
      setValidationError('Informe uma URL válida para o link da Morgana (começando com http:// ou https://).')
      return
    }
    if (!URL_REGEX.test(formData.pluralWhatsappUrl.trim())) {
      setValidationError('Informe uma URL válida para o link da Plural (começando com http:// ou https://).')
      return
    }

    setValidationError(null)
    updateMutation.mutate({
      morganaWhatsappUrl: formData.morganaWhatsappUrl.trim(),
      pluralWhatsappUrl: formData.pluralWhatsappUrl.trim(),
    })
  }

  const loadError = isError
    ? fetchError instanceof Error
      ? fetchError.message
      : 'Não foi possível carregar os links do WhatsApp.'
    : null
  const saveError = validationError || (updateMutation.isError ? (updateMutation.error as Error).message : null)
  const saving = updateMutation.isPending
  const success = updateMutation.isSuccess

  if (isLoading) {
    return <LoadingState variant="inline" />
  }

  if (loadError) {
    return (
      <Box sx={{ p: 4 }}>
        <ErrorState message={loadError} onRetry={refetch} />
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography variant="h5" fontWeight="bold" color="primary.main" sx={{ mb: 3 }}>
        Links dos Grupos de WhatsApp
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Links atualizados com sucesso!
        </Alert>
      )}

      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {saveError}
        </Alert>
      )}

      <Paper sx={{ p: 4, borderRadius: '12px' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Links usados pelas landing pages para direcionar as inscritas ao grupo do WhatsApp. Altere
          aqui sempre que o grupo precisar ser trocado.
        </Typography>

        <Grid container spacing={3}>
          <Grid size={12}>
            <TextField
              label="Link do grupo — Morgana da Cruz"
              placeholder="https://chat.whatsapp.com/..."
              fullWidth
              value={formData.morganaWhatsappUrl}
              onChange={(e) => handleChange('morganaWhatsappUrl', e.target.value)}
              required
            />
          </Grid>

          <Grid size={12}>
            <TextField
              label="Link do grupo — Plural"
              placeholder="https://chat.whatsapp.com/..."
              fullWidth
              value={formData.pluralWhatsappUrl}
              onChange={(e) => handleChange('pluralWhatsappUrl', e.target.value)}
              required
            />
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <CircularProgress size={24} color="inherit" /> : 'Salvar Alterações'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}
