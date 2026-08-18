import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ImageIcon from '@mui/icons-material/Image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import artigosService, { type Artigo, type ArtigoFormData } from '../../services/artigosService'
import { uploadToSupabaseStorage } from '../../lib/uploadToSupabaseStorage'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'

interface FormState {
  titulo: string
  slug: string
  resumo: string
  conteudo: string
  categoria: string
  autor: string
  tempoLeituraMinutos: string
  imagemCapaUrl: string
  publicado: boolean
}

const FORM_VAZIO: FormState = {
  titulo: '',
  slug: '',
  resumo: '',
  conteudo: '',
  categoria: '',
  autor: '',
  tempoLeituraMinutos: '5',
  imagemCapaUrl: '',
  publicado: false,
}

function formatarData(data?: string | null): string {
  if (!data) return '—'
  return new Date(data).toLocaleDateString('pt-BR')
}

export default function Artigos() {
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<Artigo | null>(null)
  const [form, setForm] = useState<FormState>(FORM_VAZIO)
  const [formError, setFormError] = useState<string | null>(null)
  const [aba, setAba] = useState<'editar' | 'preview'>('editar')
  const [enviandoImagem, setEnviandoImagem] = useState(false)

  const {
    data: artigos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['artigos'],
    queryFn: () => artigosService.listar(),
  })

  const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar os artigos.'

  const salvarMutation = useMutation({
    mutationFn: () => {
      if (!form.titulo.trim()) throw new Error('Informe um título.')
      if (!form.resumo.trim()) throw new Error('Informe um resumo.')
      if (!form.conteudo.trim()) throw new Error('Escreva o conteúdo do artigo.')
      if (!form.autor.trim()) throw new Error('Informe o autor.')

      const payload: ArtigoFormData = {
        titulo: form.titulo.trim(),
        slug: form.slug.trim() || undefined,
        resumo: form.resumo.trim(),
        conteudo: form.conteudo,
        categoria: form.categoria.trim() || undefined,
        autor: form.autor.trim(),
        tempoLeituraMinutos: Number(form.tempoLeituraMinutos) || 1,
        imagemCapaUrl: form.imagemCapaUrl.trim() || undefined,
        publicado: form.publicado,
      }

      return editando ? artigosService.atualizar(editando.id, payload) : artigosService.criar(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artigos'] })
      fecharDialog()
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar o artigo.')
    },
  })

  const excluirMutation = useMutation({
    mutationFn: (id: number) => artigosService.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artigos'] })
    },
  })

  const abrirNovo = () => {
    setEditando(null)
    setForm(FORM_VAZIO)
    setFormError(null)
    setAba('editar')
    setDialogAberto(true)
  }

  const abrirEdicao = async (artigo: Artigo) => {
    setFormError(null)
    setAba('editar')
    setEditando(artigo)
    setDialogAberto(true)
    try {
      const detalhe = await artigosService.buscarPorId(artigo.id)
      setForm({
        titulo: detalhe.titulo,
        slug: detalhe.slug,
        resumo: detalhe.resumo,
        conteudo: detalhe.conteudo,
        categoria: detalhe.categoria ?? '',
        autor: detalhe.autor,
        tempoLeituraMinutos: String(detalhe.tempoLeituraMinutos || 5),
        imagemCapaUrl: detalhe.imagemCapaUrl ?? '',
        publicado: detalhe.publicado,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao carregar o artigo.')
    }
  }

  const fecharDialog = () => {
    setDialogAberto(false)
    setEditando(null)
    setForm(FORM_VAZIO)
    setFormError(null)
  }

  const handleExcluir = (artigo: Artigo) => {
    if (!window.confirm(`Excluir "${artigo.titulo}"? Esta ação não pode ser desfeita.`)) return
    excluirMutation.mutate(artigo.id)
  }

  const handleImagemChange = async (file: File | null) => {
    if (!file) return
    setEnviandoImagem(true)
    setFormError(null)
    try {
      const url = await uploadToSupabaseStorage(file)
      if (url) setForm((prev) => ({ ...prev, imagemCapaUrl: url }))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao enviar a imagem.')
    } finally {
      setEnviandoImagem(false)
    }
  }

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Artigos do blog exibidos na landing page da Plural. Escreva o conteúdo em Markdown — a
        pré-visualização mostra como vai aparecer publicado. Só artigos marcados como
        &quot;Publicado&quot; aparecem no site.
      </Typography>

      <Paper elevation={0} sx={{ overflow: 'hidden' }}>
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" color="primary.main">
              Artigos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {artigos.length} artigo{artigos.length !== 1 ? 's' : ''} cadastrado{artigos.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
            Novo artigo
          </Button>
        </Box>

        {isLoading && <LoadingState rows={5} />}

        {isError && <ErrorState message={errorMessage} onRetry={() => refetch()} />}

        {!isLoading && !isError && (
          <>
            {excluirMutation.isError && (
              <Box sx={{ px: 3, pt: 2 }}>
                <ErrorState message="Não foi possível excluir o artigo." />
              </Box>
            )}

            {artigos.length === 0 ? (
              <EmptyState
                title="Nenhum artigo cadastrado"
                description='Clique em "Novo artigo" para publicar o primeiro.'
              />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ pl: 4 }}>Artigo</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Categoria</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Autor</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Publicado em</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right" sx={{ pr: 4 }}>
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {artigos.map((artigo) => (
                      <TableRow key={artigo.id} hover sx={{ height: 65, '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ pl: 4 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar src={artigo.imagemCapaUrl ?? undefined} variant="rounded" sx={{ width: 40, height: 40 }}>
                              <ImageIcon fontSize="small" />
                            </Avatar>
                            <Typography fontWeight={600} color="primary.main">
                              {artigo.titulo}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          {artigo.categoria || '—'}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{artigo.autor}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          {formatarData(artigo.publicadoEm)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={artigo.publicado ? 'Publicado' : 'Rascunho'}
                            color={artigo.publicado ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 4 }}>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => abrirEdicao(artigo)}>
                              <EditIcon fontSize="small" color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton
                              size="small"
                              onClick={() => handleExcluir(artigo)}
                              disabled={excluirMutation.isPending}
                            >
                              <DeleteIcon fontSize="small" color="error" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>

      <Dialog open={dialogAberto} onClose={fecharDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editando ? 'Editar artigo' : 'Novo artigo'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Título"
                  fullWidth
                  value={form.titulo}
                  onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
                  autoFocus
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Slug (opcional)"
                  fullWidth
                  placeholder="gerado a partir do título"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                />
              </Grid>
            </Grid>

            <TextField
              label="Resumo"
              fullWidth
              multiline
              minRows={2}
              value={form.resumo}
              onChange={(e) => setForm((prev) => ({ ...prev, resumo: e.target.value }))}
              helperText="Aparece no card do blog e na busca do Google."
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Categoria"
                  fullWidth
                  value={form.categoria}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Autor"
                  fullWidth
                  value={form.autor}
                  onChange={(e) => setForm((prev) => ({ ...prev, autor: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Tempo de leitura (min)"
                  type="number"
                  fullWidth
                  value={form.tempoLeituraMinutos}
                  onChange={(e) => setForm((prev) => ({ ...prev, tempoLeituraMinutos: e.target.value }))}
                />
              </Grid>
            </Grid>

            <Box>
              <Button component="label" variant="outlined" startIcon={<ImageIcon />} disabled={enviandoImagem}>
                {enviandoImagem ? 'Enviando…' : form.imagemCapaUrl ? 'Trocar imagem de capa' : 'Enviar imagem de capa'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleImagemChange(e.target.files?.[0] ?? null)}
                />
              </Button>
              {form.imagemCapaUrl && (
                <Box sx={{ mt: 1.5 }}>
                  <Avatar src={form.imagemCapaUrl} variant="rounded" sx={{ width: 96, height: 72 }} />
                </Box>
              )}
            </Box>

            <Box>
              <Tabs value={aba} onChange={(_, v) => setAba(v)} sx={{ mb: 1.5 }}>
                <Tab value="editar" label="Escrever (Markdown)" />
                <Tab value="preview" label="Pré-visualizar" />
              </Tabs>

              {aba === 'editar' ? (
                <TextField
                  fullWidth
                  multiline
                  minRows={12}
                  placeholder="## Título&#10;&#10;Texto do artigo em Markdown..."
                  value={form.conteudo}
                  onChange={(e) => setForm((prev) => ({ ...prev, conteudo: e.target.value }))}
                  sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 14 } }}
                />
              ) : (
                <Box
                  sx={{
                    minHeight: 280,
                    p: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    '& h1, & h2, & h3': { color: 'primary.main', mt: 2, mb: 1 },
                    '& p': { mb: 1.5, lineHeight: 1.7 },
                    '& ul, & ol': { pl: 3, mb: 1.5 },
                  }}
                >
                  {form.conteudo.trim() ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.conteudo}</ReactMarkdown>
                  ) : (
                    <Typography color="text.secondary">Nada para pré-visualizar ainda.</Typography>
                  )}
                </Box>
              )}
            </Box>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={form.publicado}
                onChange={(e) => setForm((prev) => ({ ...prev, publicado: e.target.checked }))}
              />
              <Typography variant="body2">
                {form.publicado ? 'Publicado — visível na LP' : 'Rascunho — não aparece na LP'}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => salvarMutation.mutate()}
            disabled={salvarMutation.isPending || enviandoImagem}
          >
            {editando ? 'Salvar alterações' : 'Criar artigo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
