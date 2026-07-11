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
import configuracoesService, { LinksWhatsApp } from '../../services/configuracoesService'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import {
  normalizeWhatsappUrl,
  truncateUrl,
  validateLinks,
} from './whatsappLinkUtils'

type LinkField = keyof LinksWhatsApp

interface GrupoConfig {
  field: LinkField
  titulo: string
  descricao: string
  landingPage: string
  icone: string
  iconeAlt: string
  iconeBg: string
}

const GRUPOS: GrupoConfig[] = [
  {
    field: 'morganaWhatsappUrl',
    titulo: 'Morgana da Cruz',
    descricao: 'Grupo exibido na landing page da Morgana após a inscrição.',
    landingPage: 'morganadacruz.com.br',
    icone: '/morgana.png',
    iconeAlt: 'Logo Morgana da Cruz',
    iconeBg: '#F27D16',
  },
  {
    field: 'pluralWhatsappUrl',
    titulo: 'Plural',
    descricao: 'Grupo exibido na landing page da Plural na página de espera.',
    landingPage: 'pluralplataforma.com',
    icone: '/plural.png',
    iconeAlt: 'Logo Plural',
    iconeBg: '#111111',
  },
]

function LinkGrupoCard({
  config,
  savedUrl,
  draftUrl,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
}: {
  config: GrupoConfig
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
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
          <Box
            component="img"
            src={config.icone}
            alt={config.iconeAlt}
            sx={{
              width: 52,
              height: 52,
              borderRadius: '12px',
              objectFit: 'cover',
              flexShrink: 0,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {config.descricao}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Landing page: {config.landingPage}
            </Typography>
          </Box>
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
                    Abrir grupo
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
                Nenhum link cadastrado ainda. Clique em &quot;Trocar link&quot; para configurar o grupo.
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
              label="Novo link do grupo"
              placeholder="https://chat.whatsapp.com/..."
              fullWidth
              value={draftUrl}
              onChange={(e) => onDraftChange(e.target.value)}
              helperText="Cole o link de convite do WhatsApp. O https:// será adicionado automaticamente, se necessário."
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

export default function LinksGruposWhatsApp() {
  const queryClient = useQueryClient()
  const [savedLinks, setSavedLinks] = useState<LinksWhatsApp>({
    morganaWhatsappUrl: '',
    pluralWhatsappUrl: '',
  })
  const [formData, setFormData] = useState<LinksWhatsApp>({
    morganaWhatsappUrl: '',
    pluralWhatsappUrl: '',
  })
  const [editingField, setEditingField] = useState<LinkField | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

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
    if (!links) return

    const normalized = {
      morganaWhatsappUrl: links.morganaWhatsappUrl ?? '',
      pluralWhatsappUrl: links.pluralWhatsappUrl ?? '',
    }

    setSavedLinks(normalized)
    setFormData(normalized)
    setEditingField(null)
    setValidationError(null)
  }, [links])

  const updateMutation = useMutation({
    mutationFn: (data: LinksWhatsApp) => configuracoesService.updateLinksWhatsApp(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['links-whatsapp'], data)
      setEditingField(null)
      setValidationError(null)
      setShowSuccess(true)
      window.setTimeout(() => setShowSuccess(false), 4000)
    },
  })

  const hasChanges = useMemo(
    () =>
      formData.morganaWhatsappUrl !== savedLinks.morganaWhatsappUrl
      || formData.pluralWhatsappUrl !== savedLinks.pluralWhatsappUrl,
    [formData, savedLinks],
  )

  const handleStartEdit = (field: LinkField) => {
    setEditingField(field)
    setValidationError(null)
    setShowSuccess(false)
  }

  const handleCancelEdit = (field: LinkField) => {
    setFormData((prev) => ({ ...prev, [field]: savedLinks[field] }))
    setEditingField(null)
    setValidationError(null)
  }

  const handleDraftChange = (field: LinkField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    const validationMessage = validateLinks(formData)
    if (validationMessage) {
      setValidationError(validationMessage)
      return
    }

    setValidationError(null)
    updateMutation.mutate({
      morganaWhatsappUrl: normalizeWhatsappUrl(formData.morganaWhatsappUrl),
      pluralWhatsappUrl: normalizeWhatsappUrl(formData.pluralWhatsappUrl),
    })
  }

  const loadError = isError
    ? fetchError instanceof Error
      ? fetchError.message
      : 'Não foi possível carregar os links do WhatsApp.'
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
        Gerencie os links dos grupos de WhatsApp usados pelas landing pages. Quando um grupo for
        recriado ou o convite expirar, atualize o link aqui — as páginas passam a usar o novo
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
        {GRUPOS.map((grupo) => (
          <Grid key={grupo.field} size={{ xs: 12, lg: 6 }}>
            <LinkGrupoCard
              config={grupo}
              savedUrl={savedLinks[grupo.field]}
              draftUrl={formData[grupo.field]}
              isEditing={editingField === grupo.field}
              onStartEdit={() => handleStartEdit(grupo.field)}
              onCancelEdit={() => handleCancelEdit(grupo.field)}
              onDraftChange={(value) => handleDraftChange(grupo.field, value)}
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
            Você tem alterações pendentes. Salve para que as landing pages usem os novos links.
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
