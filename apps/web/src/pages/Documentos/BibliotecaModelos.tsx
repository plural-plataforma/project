import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import bibliotecaModelosService, { type DocumentoBiblioteca } from '../../services/bibliotecaModelosService'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface FormState {
  nome: string
  categoria: string
  arquivo: File | null
}

const FORM_VAZIO: FormState = { nome: '', categoria: '', arquivo: null }

export default function BibliotecaModelos() {
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<DocumentoBiblioteca | null>(null)
  const [form, setForm] = useState<FormState>(FORM_VAZIO)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    data: documentos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['biblioteca-modelos'],
    queryFn: () => bibliotecaModelosService.listar(),
  })

  const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar a biblioteca de modelos.'

  const salvarMutation = useMutation({
    mutationFn: () => {
      if (!form.nome.trim()) throw new Error('Informe um nome para o documento.')
      if (!editando && !form.arquivo) throw new Error('Selecione um arquivo .docx para enviar.')

      const payload = { nome: form.nome.trim(), categoria: form.categoria.trim() || undefined, arquivo: form.arquivo }
      return editando
        ? bibliotecaModelosService.atualizar(editando.id, payload)
        : bibliotecaModelosService.criar(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biblioteca-modelos'] })
      fecharDialog()
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar o documento.')
    },
  })

  const excluirMutation = useMutation({
    mutationFn: (id: number) => bibliotecaModelosService.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biblioteca-modelos'] })
    },
  })

  const abrirNovo = () => {
    setEditando(null)
    setForm(FORM_VAZIO)
    setFormError(null)
    setDialogAberto(true)
  }

  const abrirEdicao = (documento: DocumentoBiblioteca) => {
    setEditando(documento)
    setForm({ nome: documento.nome, categoria: documento.categoria ?? '', arquivo: null })
    setFormError(null)
    setDialogAberto(true)
  }

  const fecharDialog = () => {
    setDialogAberto(false)
    setEditando(null)
    setForm(FORM_VAZIO)
    setFormError(null)
  }

  const handleExcluir = (documento: DocumentoBiblioteca) => {
    if (!window.confirm(`Excluir "${documento.nome}"? Esta ação não pode ser desfeita.`)) return
    excluirMutation.mutate(documento.id)
  }

  const handleBaixar = (documento: DocumentoBiblioteca) => {
    void bibliotecaModelosService.baixar(documento)
  }

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Modelos de documento (.docx) disponibilizados para download pelas professoras dentro da
        plataforma. Envie ou atualize os arquivos aqui — a lista aparece automaticamente na aba
        &quot;Biblioteca de Modelos&quot; do app da professora.
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
              Biblioteca de Modelos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {documentos.length} documento{documentos.length !== 1 ? 's' : ''} cadastrado{documentos.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
            Novo documento
          </Button>
        </Box>

        {isLoading && <LoadingState rows={5} />}

        {isError && <ErrorState message={errorMessage} onRetry={() => refetch()} />}

        {!isLoading && !isError && (
          <>
            {excluirMutation.isError && (
              <Box sx={{ px: 3, pt: 2 }}>
                <ErrorState message="Não foi possível excluir o documento." />
              </Box>
            )}

            {documentos.length === 0 ? (
              <EmptyState
                title="Nenhum documento cadastrado"
                description="Clique em &quot;Novo documento&quot; para enviar o primeiro modelo."
              />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ pl: 4 }}>Nome</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Categoria</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Arquivo</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Tamanho</TableCell>
                      <TableCell align="right" sx={{ pr: 4 }}>
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {documentos.map((documento) => (
                      <TableRow key={documento.id} hover sx={{ height: 65, '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ pl: 4 }}>
                          <Typography fontWeight={600} color="primary.main">
                            {documento.nome}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          {documento.categoria || '—'}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="body2" color="text.secondary">
                            {documento.nomeArquivoOriginal}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          {formatarTamanho(documento.tamanhoBytes)}
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 4 }}>
                          <Tooltip title="Baixar">
                            <IconButton size="small" onClick={() => handleBaixar(documento)}>
                              <DownloadIcon fontSize="small" color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => abrirEdicao(documento)}>
                              <EditIcon fontSize="small" color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton
                              size="small"
                              onClick={() => handleExcluir(documento)}
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

      <Dialog open={dialogAberto} onClose={fecharDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editando ? 'Editar documento' : 'Novo documento'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Nome"
              fullWidth
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              autoFocus
            />

            <TextField
              label="Categoria (opcional)"
              fullWidth
              value={form.categoria}
              onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))}
            />

            <Box>
              <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
                {form.arquivo ? form.arquivo.name : editando ? 'Trocar arquivo (.docx)' : 'Selecionar arquivo (.docx)'}
                <input
                  type="file"
                  accept=".docx"
                  hidden
                  onChange={(e) => setForm((prev) => ({ ...prev, arquivo: e.target.files?.[0] ?? null }))}
                />
              </Button>
              {editando && !form.arquivo && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Arquivo atual: {editando.nomeArquivoOriginal} (mantido se nenhum novo for selecionado)
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => salvarMutation.mutate()}
            disabled={salvarMutation.isPending}
          >
            {editando ? 'Salvar alterações' : 'Enviar documento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
