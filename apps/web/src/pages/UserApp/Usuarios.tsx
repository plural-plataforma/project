// pages/Usuarios.tsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Button,
  Chip,
  Avatar,
  InputBase,
  alpha,
  Stack,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
  Folder as FolderIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material'
import React from 'react'
import InfoCard from '../../components/InfoCard'

const API_URL = import.meta.env.VITE_API_URL

interface Professor {
  transaction: string
  buyerName: string
  buyerEmail?: string
  jaCadastradoComoProfessor?: boolean
  professorId: number
  nivelEnsino: string
  ativo: boolean
  roles: string[]
  telefone: number
  perfil: string
  isEmbaixadora: boolean
}

export default function Usuarios() {
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const [snackOpen, setSnackOpen] = useState(false)
  const [snackMessage, setSnackMessage] = useState('')
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>(
    'success'
  )

  useEffect(() => {
    const fetchProfessores = async () => {
      const token =
        localStorage.getItem('token') || sessionStorage.getItem('token')

      if (!token) {
        setError('Sessão expirada. Faça login novamente.')
        setLoading(false)
        return
      }

      try {
        const response = await axios.get(`${API_URL}/vendas/hotmart`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const data = response.data.data || []
        setProfessores(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Erro ao carregar usuários:', err)
        setError('Não foi possível carregar a lista de usuários.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfessores()
  }, [])

  // Seleção múltipla
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(professores.map(p => p.transaction))
    } else {
      setSelected([])
    }
  }

  const handleSelect = (transaction: string) => {
    setSelected(prev =>
      prev.includes(transaction)
        ? prev.filter(id => id !== transaction)
        : [...prev, transaction]
    )
  }

  const filteredProfessores = professores.filter(
    prof =>
      prof.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
      prof.buyerEmail?.toLowerCase().includes(search.toLowerCase())
  )

  // Dados mock para os cards (substitua por API real se tiver)
  const stats = [
    {
      titulo: 'Total de Usuários',
      valor: '2.847',
      variacao: '+12%',
      icone: <PeopleIcon fontSize="large" />,
      corFundoIcone: '#E3F2FD',
      corIcone: '#276678'
    },
    {
      titulo: 'Usuários Ativos',
      valor: '2.654',
      variacao: '+8%',
      icone: <CheckIcon fontSize="large" />,
      corFundoIcone: '#E8F5E9',
      corIcone: '#4CAF50'
    },
    {
      titulo: 'Habilidades',
      valor: '156',
      variacao: '+25',
      icone: <StarIcon fontSize="large" />,
      corFundoIcone: '#F3E5F5',
      corIcone: '#9C27B0'
    },
    {
      titulo: 'Atividades',
      valor: '1.234',
      variacao: '+42',
      icone: <FolderIcon fontSize="large" />,
      corFundoIcone: '#FFF3E0',
      corIcone: '#FF9800'
    }
  ]

  return (
    <Box sx={{ width: '100%', bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Cards de Estatísticas */}
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <InfoCard
              titulo={stat.titulo}
              valor={stat.valor}
              variacao={stat.variacao}
              icone={stat.icone}
              corFundoIcone={stat.corFundoIcone}
              corIcone={stat.corIcone}
            />
          </Grid>
        ))}
      </Grid>

      {/* Lista de Usuários */}
      <Box sx={{ px: { xs: 2, md: 4 }, pb: 8 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'grey.200',
            overflow: 'hidden'
          }}
        >
          {/* Cabeçalho */}
          <Box
            sx={{ p: 3, borderBottom: '1px solid', borderColor: 'grey.200' }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
            >
              <Box>
                <Typography variant="h6" fontWeight="bold" color="#276678">
                  Lista de Usuários
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gerencie e monitore todos os usuários cadastrados
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  size="small"
                >
                  Filtrar
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  size="small"
                >
                  Exportar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ bgcolor: '#276678', '&:hover': { bgcolor: '#1e4d5a' } }}
                  size="small"
                >
                  Novo Usuário
                </Button>
              </Stack>
            </Stack>
          </Box>

          {/* Conteúdo da tabela */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 4 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={
                            selected.length > 0 &&
                            selected.length < filteredProfessores.length
                          }
                          checked={
                            selected.length === filteredProfessores.length &&
                            filteredProfessores.length > 0
                          }
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell>Usuário</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Último Acesso</TableCell>
                      <TableCell align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredProfessores.slice(0, 5).map(prof => {
                      // limitando a 5 para exemplo
                      const isSelected = selected.includes(prof.transaction)
                      const statusText = prof.jaCadastradoComoProfessor
                        ? prof.ativo
                          ? 'Ativo'
                          : 'Inativo'
                        : 'Não cadastrado'

                      return (
                        <TableRow
                          key={prof.transaction}
                          hover
                          selected={isSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleSelect(prof.transaction)}
                            />
                          </TableCell>

                          <TableCell>
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >
                              <Avatar sx={{ bgcolor: '#276678' }}>
                                {prof.buyerName?.[0] || '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">
                                  {prof.buyerName}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {prof.buyerEmail || '—'}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={prof.roles?.[0] || 'Professor'}
                              size="small"
                              sx={{
                                bgcolor: prof.roles?.[0]?.includes(
                                  'Coordenador'
                                )
                                  ? '#F3E5F5'
                                  : '#E3F2FD',
                                color: prof.roles?.[0]?.includes('Coordenador')
                                  ? '#9C27B0'
                                  : '#276678',
                                borderColor: alpha('#276678', 0.3)
                              }}
                              variant="outlined"
                            />
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={statusText}
                              size="small"
                              color={
                                statusText === 'Ativo'
                                  ? 'success'
                                  : statusText === 'Inativo'
                                    ? 'error'
                                    : 'warning'
                              }
                            />
                          </TableCell>

                          <TableCell>
                            {/* Mock - adicione campo real se tiver */}Há 2
                            horas
                          </TableCell>

                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="flex-end"
                            >
                              <IconButton size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small">
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Paginação */}
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid',
                  borderColor: 'grey.200',
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Mostrando 1 a 5 de {filteredProfessores.length} resultados
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button size="small" disabled>
                    &lt;
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ minWidth: 32 }}
                  >
                    1
                  </Button>
                  <Button size="small">2</Button>
                  <Button size="small">3</Button>
                  <Button size="small">...</Button>
                  <Button size="small">570</Button>
                  <Button size="small">&gt;</Button>
                </Stack>
              </Box>
            </>
          )}
        </Paper>
      </Box>

      {/* Cards inferiores */}
      <Box sx={{ px: { xs: 2, md: 4 }, pb: 6 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                bgcolor: 'linear-gradient(135deg, #5C6BC0 0%, #3F51B5 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 5 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Gerenciar Habilidades
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                      Adicione, edite ou desabilite habilidades da plataforma
                    </Typography>
                  </Box>
                  <IconButton
                    sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                bgcolor: 'linear-gradient(135deg, #AB47BC 0%, #7B1FA2 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 5 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Blocos de Avaliação
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                      Crie e configure blocos para avaliações diagnósticas
                    </Typography>
                  </Box>
                  <IconButton
                    sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
