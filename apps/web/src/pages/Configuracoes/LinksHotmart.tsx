import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Link,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import EditIcon from '@mui/icons-material/Edit'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import configuracoesService, { type LinkCheckout } from '../../services/configuracoesService'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import {
  normalizeCheckoutUrl,
  truncateUrl,
  validateLinkCheckout,
} from './checkoutLinkUtils'

type CheckoutField = keyof LinkCheckout

interface PlanoConfig {
  field: CheckoutField
  titulo: string
  descricao: string
}

const PLANOS: PlanoConfig[] = [
  {
    field: 'pluralCheckoutUrlMensal',
    titulo: 'Assinatura Mensal',
    descricao: 'Link de checkout Hotmart usado pelo card de plano mensal na landing page.',
  },
  {
    field: 'pluralCheckoutUrlAnual',
    titulo: 'Assinatura Anual',
    descricao: 'Link de checkout Hotmart usado pelo card de plano anual na landing page.',
  },
]

function LinkCheckoutCard({
  config,
  savedUrl,
  draftUrl,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
}: {
  config: PlanoConfig
  savedUrl: string
  draftUrl: string
  isEditing: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onDraftChange: (value: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const hasLink = Boolean(savedUrl.trim())

  const handleCopy = async () => {
    if (!savedUrl.trim()) return
    await navigator.clipboard.writeText(savedUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: '12px',
        borderColor: hasLink ? 'success.light' : 'divider',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h6" fontWeight={700}>
              {config.titulo}
            </Typography>
            <Chip
              size="small"
              label={hasLink ? 'Link configurado' : 'Sem link'}
              color={hasLink ? 'success' : 'default'}
              variant={hasLink ? 'filled' : 'outlined'}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {config.descricao}
          </Typography>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {!isEditing ? (
          <Stack spacing={2}>
            {hasLink ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: '8px',
                  bgcolor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Link atual
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    color: 'text.primary',
                  }}
                >
                  {truncateUrl(savedUrl, 72)}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    component={Link}
                    href={savedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir checkout
                  </Button>
                  <Tooltip title={copied ? 'Copiado!' : 'Copiar link'}>
                    <IconButton size="small" onClick={handleCopy} aria-label="Copiar link">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            ) : (
              <Alert severity="info" sx={{ borderRadius: '8px' }}>
                Nenhum link cadastrado ainda. Clique em &quot;Trocar link&quot; para configurar o checkout.
              </Alert>
            )}

            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={onStartEdit}
              sx={{ alignSelf: 'flex-start' }}
            >
              Trocar link
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <TextField
              label="Novo link de checkout"
              placeholder="https://pay.hotmart.com/..."
              fullWidth
              value={draftUrl}
              onChange={(e) => onDraftChange(e.target.value)}
              helperText="Cole o link de venda da Hotmart. O https:// será adicionado automaticamente, se necessário."
              autoFocus
            />

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={onCancelEdit}>
                Cancelar
              </Button>
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

export default function LinksHotmart() {
  const queryClient = useQueryClient()
  const [savedLinks, setSavedLinks] = useState<LinkCheckout>({
    pluralCheckoutUrlMensal: '',
    pluralCheckoutUrlAnual: '',
  })
  const [formData, setFormData] = useState<LinkCheckout>({
    pluralCheckoutUrlMensal: '',
    pluralCheckoutUrlAnual: '',
  })
  const [editingField, setEditingField] = useState<CheckoutField | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const {
    data: links,
    isLoading,
    isError,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: ['link-checkout'],
    queryFn: () => configuracoesService.getLinkCheckout(),
  })

  useEffect(() => {
    if (!links) return

    const normalized = {
      pluralCheckoutUrlMensal: links.pluralCheckoutUrlMensal ?? '',
      pluralCheckoutUrlAnual: links.pluralCheckoutUrlAnual ?? '',
    }

    setSavedLinks(normalized)
    setFormData(normalized)
    setEditingField(null)
    setValidationError(null)
  }, [links])

  const updateMutation = useMutation({
    mutationFn: (data: LinkCheckout) => configuracoesService.updateLinkCheckout(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['link-checkout'], data)
      setEditingField(null)
      setValidationError(null)
      setShowSuccess(true)
      window.setTimeout(() => setShowSuccess(false), 4000)
    },
  })

  const hasChanges = useMemo(
    () =>
      formData.pluralCheckoutUrlMensal !== savedLinks.pluralCheckoutUrlMensal
      || formData.pluralCheckoutUrlAnual !== savedLinks.pluralCheckoutUrlAnual,
    [formData, savedLinks],
  )

  const handleStartEdit = (field: CheckoutField) => {
    setEditingField(field)
    setValidationError(null)
    setShowSuccess(false)
  }

  const handleCancelEdit = (field: CheckoutField) => {
    setFormData((prev) => ({ ...prev, [field]: savedLinks[field] }))
    setEditingField(null)
    setValidationError(null)
  }

  const handleDraftChange = (field: CheckoutField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    const validationMessage = validateLinkCheckout(formData)
    if (validationMessage) {
      setValidationError(validationMessage)
      return
    }

    setValidationError(null)
    updateMutation.mutate({
      pluralCheckoutUrlMensal: normalizeCheckoutUrl(formData.pluralCheckoutUrlMensal),
      pluralCheckoutUrlAnual: normalizeCheckoutUrl(formData.pluralCheckoutUrlAnual),
    })
  }

  const loadError = isError
    ? fetchError instanceof Error
      ? fetchError.message
      : 'Não foi possível carregar os links de venda.'
    : null
  const saveError = validationError || (updateMutation.isError ? (updateMutation.error as Error).message : null)
  const saving = updateMutation.isPending

  if (isLoading) {
    return <LoadingState variant="inline" />
  }

  if (loadError) {
    return <ErrorState message={loadError} onRetry={refetch} />
  }

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Gerencie os links de venda (checkout Hotmart) mensal e anual usados na landing page da
        Plural. Quando a oferta mudar, atualize o link aqui — a página passa a usar o novo
        automaticamente.
      </Typography>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Links atualizados com sucesso!
        </Alert>
      )}

      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {saveError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {PLANOS.map((plano) => (
          <Grid key={plano.field} size={{ xs: 12, lg: 6 }}>
            <LinkCheckoutCard
              config={plano}
              savedUrl={savedLinks[plano.field]}
              draftUrl={formData[plano.field]}
              isEditing={editingField === plano.field}
              onStartEdit={() => handleStartEdit(plano.field)}
              onCancelEdit={() => handleCancelEdit(plano.field)}
              onDraftChange={(value) => handleDraftChange(plano.field, value)}
            />
          </Grid>
        ))}
      </Grid>

      {hasChanges && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: '12px',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Você tem alterações pendentes. Salve para que a landing page use os novos links.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saving}
            sx={{ flexShrink: 0 }}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Salvar alterações'}
          </Button>
        </Box>
      )}
    </Box>
  )
}
