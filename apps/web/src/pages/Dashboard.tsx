import { useState, useEffect } from 'react'
import axios from 'axios'
import { SignOut } from '../components/SignOut'
import PersonIcon from '@mui/icons-material/Person'
import InfoCard from '../components/InfoCard'
import Header from '../components/Header'

const API_URL = import.meta.env.VITE_API_URL

import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Chip,
  Snackbar,
  Modal
} from '@mui/material'
import Sidebar from '../components/Sidebar'
import ProfileUserAppEdit from './UserApp/ProfileUserApp'
import { Usuario } from '../types/userTypes'

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

export default function Dashboard() {
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filtroStatusCadastro, setFiltroStatusCadastro] = useState<
    'todos' | 'cadastrado' | 'naoCadastrado' | 'Inativo'
  >('todos')

  const [snackOpen, setSnackOpen] = useState(false)
  const [snackMessage, setSnackMessage] = useState('')
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>(
    'success'
  )

  const [cadastrandoEmail, setCadastrandoEmail] = useState<string | null>(null)

  // Estados da modal
  const [openModal, setOpenModal] = useState(false)
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(
    null
  ) // ← guardamos o professor inteiro
  const [initialData, setInitialData] = useState<Partial<Usuario> | undefined>(
    undefined
  )

  const signOut = SignOut()

  useEffect(() => {
    const fetchProfessores = async () => {
      const token =
        localStorage.getItem('token') || sessionStorage.getItem('token')

      if (!token) {
        setError(
          'Nenhum token de autenticação encontrado. Faça login novamente.'
        )
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
        console.error('Erro na requisição:', err)
        setError('Erro ao carregar os dados. Tente novamente mais tarde.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfessores()
  }, [])

  // Função para cadastrar o professor
  const cadastrarProfessor = async (email: string, nome: string) => {
    if (!email || !nome) {
      setSnackMessage('E-mail ou nome não informado.')
      setSnackSeverity('error')
      setSnackOpen(true)
      return
    }

    setCadastrandoEmail(email)

    try {
      const token =
        localStorage.getItem('token') || sessionStorage.getItem('token')

      await axios.post(
        `${API_URL}/autenticacao/registro`,
        {
          email: email.trim(),
          senha: 'Plural@2025',
          nomeCompleto: nome.trim(),
          aceitouTermos: true,
          deveAlterarSenha: true
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // Atualiza o estado local: marca como cadastrado
      setProfessores(prev =>
        prev.map(p =>
          p.buyerEmail?.toLowerCase() === email.toLowerCase()
            ? { ...p, jaCadastradoComoProfessor: true }
            : p
        )
      )

      setSnackMessage(
        `Professor ${nome} cadastrado com sucesso! Senha inicial: Plural@2025. Agora você pode acessar o perfil.`
      )
      setSnackSeverity('success')
      setSnackOpen(true)
    } catch (err: unknown) {
      console.error('Erro ao cadastrar:', err)

      let mensagemErro = 'Erro ao cadastrar. O e-mail pode já estar em uso.'

      if (axios.isAxiosError(err)) {
        mensagemErro =
          err.response?.data?.mensagem ||
          err.response?.data?.title ||
          mensagemErro
      }

      setSnackMessage(mensagemErro)
      setSnackSeverity('error')
      setSnackOpen(true)
    } finally {
      setCadastrandoEmail(null)
    }
  }

  // Filtros
  const filteredProfessores = professores.filter(prof => {
    const matchesSearch =
      prof.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
      prof.buyerEmail?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      filtroStatusCadastro === 'todos' ||
      (filtroStatusCadastro === 'cadastrado' &&
        prof.jaCadastradoComoProfessor === true &&
        prof.ativo === true) ||
      (filtroStatusCadastro === 'naoCadastrado' &&
        prof.jaCadastradoComoProfessor === false) ||
      (filtroStatusCadastro === 'Inativo' &&
        prof.jaCadastradoComoProfessor === true &&
        prof.ativo === false)

    return matchesSearch && matchesStatus
  })

  const totalCompradores = professores.length
  const cadastrados = professores.filter(
    p => p.jaCadastradoComoProfessor
  ).length
  const naoCadastrados = totalCompradores - cadastrados

  const mapNivelToId = (nivel: string): number | undefined => {
    const map: Record<string, number> = {
      'Educação Infantil': 1,
      'Ensino Fundamental I - Anos Iniciais': 2,
      'Ensino Fundamental II - Anos Finais': 3,
      'Ensino Médio': 4
    }
    return map[nivel] || undefined
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          flex: 1,
          p: { xs: 1, md: 2 }
        }}
      >
        {/* Main Content */}
        <Box
          component="main"
          sx={{ flex: 1, p: { xs: 0, sm: 0 }, overflowY: 'auto' }}
        >
          {/* Cards */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
            <InfoCard
              titulo="Total Compradores"
              valor={totalCompradores}
              icone={<PersonIcon />}
              corFundo="#e3f2fd"
              corIcone="#1976d2"
            />
            <InfoCard
              titulo="Já Cadastrados"
              valor={cadastrados}
              icone={<PersonIcon />}
              corFundo="#e8f5e8"
              corIcone="#2e7d32"
            />
            <InfoCard
              titulo="Pendentes"
              valor={naoCadastrados}
              icone={<PersonIcon />}
              corFundo="#fff3e0"
              corIcone="#ed6c02"
            />
          </Box>

          {/* Filtros */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 4,
              alignItems: 'center'
            }}
          >
            <TextField
              placeholder="Buscar por nome ou e-mail"
              fullWidth
              size="small"
              value={search}
              label="Buscar por nome ou e-mail"
              onChange={e => setSearch(e.target.value)}
            />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filtroStatusCadastro}
                label="Status"
                onChange={e => setFiltroStatusCadastro(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="cadastrado">Ativo</MenuItem>
                <MenuItem value="Inativo">Inativo</MenuItem>

                <MenuItem value="naoCadastrado">Não Cadastrado</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              sx={{ height: 40, textTransform: 'none' }}
              onClick={() => {
                setSearch('')
                setFiltroStatusCadastro('todos')
              }}
            >
              Limpar
            </Button>
          </Box>

          {/* Tabela */}
          {loading ? (
            <Box textAlign="center" my={8}>
              <CircularProgress color="primary" />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : (
            <Paper elevation={3} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>
                      Transação
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>
                      Nome
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '28%' }}>
                      E-mail
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '17%' }}>
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        width: '15%',
                        textAlign: 'center'
                      }}
                    >
                      Ação
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProfessores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">
                          Nenhum comprador encontrado com os filtros aplicados.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfessores.map(prof => (
                      <TableRow key={prof.transaction} hover>
                        <TableCell
                          sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                        >
                          {prof.transaction}
                        </TableCell>
                        <TableCell
                          sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
                        >
                          {prof.buyerName}
                        </TableCell>
                        <TableCell
                          sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
                        >
                          {prof.buyerEmail || '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              prof.jaCadastradoComoProfessor
                                ? prof.ativo
                                  ? 'Ativo'
                                  : 'Inativo'
                                : 'Não cadastrado'
                            }
                            color={
                              !prof.jaCadastradoComoProfessor
                                ? 'warning'
                                : prof.ativo
                                  ? 'success'
                                  : 'error'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {prof.jaCadastradoComoProfessor ? (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              sx={{ minWidth: 110 }}
                              onClick={() => {
                                setSelectedProfessor(prof) // ← guarda o professor selecionado
                                setInitialData({
                                  idUsuario: prof.professorId,
                                  nome: prof.buyerName,
                                  email: prof.buyerEmail || '',
                                  telefone: prof.telefone, // ou busque se tiver
                                  perfil: prof.roles[0], // valor padrão ou mapeie de roles
                                  ativo: prof.ativo,
                                  idNivelEnsino: mapNivelToId(prof.nivelEnsino),
                                  isEmbaixadora: prof.isEmbaixadora
                                })
                                setOpenModal(true)
                              }}
                            >
                              Ver Perfil
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              sx={{ bgcolor: '#276678', minWidth: 110 }}
                              onClick={() =>
                                cadastrarProfessor(
                                  prof.buyerEmail!,
                                  prof.buyerName
                                )
                              }
                              disabled={
                                cadastrandoEmail === prof.buyerEmail ||
                                !prof.buyerEmail
                              }
                            >
                              {cadastrandoEmail === prof.buyerEmail ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                'Cadastrar'
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Snackbar de feedback */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity={snackSeverity}
          sx={{ width: '100%' }}
        >
          {snackMessage}
        </Alert>
      </Snackbar>

      {/* Modal de Edição */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        aria-labelledby="modal-edit-perfil"
      >
        <ProfileUserAppEdit
          open={openModal}
          onClose={() => setOpenModal(false)}
          // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
          userId={selectedProfessor?.professorId!}
          initialData={initialData}
        />
      </Modal>
    </Box>
  )
}
