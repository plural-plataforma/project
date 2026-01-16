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
  Modal,
  Avatar,
  Checkbox
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
  const cadastrados = professores.filter(p => p.jaCadastradoComoProfessor).length
  const naoCadastrados = totalCompradores - cadastrados

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header FIXO no topo */}
      <Header />

      {/* Container principal com sidebar fixa + conteúdo com margem */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar FIXA à esquerda */}
        <Sidebar activeRoute="/dashboard" onSignOut={signOut} />

        {/* Conteúdo principal – com margem esquerda para não ficar sobreposto */}
        <Box
          component="main"
          sx={{
            flex: 1,
            ml: { md: '260px' },           // ← IMPORTANTE: mesma largura da sidebar
            mt: '64px',                    // ← altura do header fixo
            p: { xs: 2, md: 4 },
            bgcolor: 'grey.50',
            minHeight: 'calc(100vh - 64px)',
            overflowY: 'auto'
          }}
        >
    

          {/* Cards de estatística */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 3, mb: 5 }}>
            <InfoCard
              titulo="Total de Usuários"
              valor={totalCompradores}
              
              icone={<PersonIcon />}
              corFundo="#e3f2fd"
              corIcone="#1976d2"
            />
            <InfoCard
              titulo="Usuários Ativos"
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

          {/* Área de busca e filtros */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4, alignItems: 'center' }}>
            <TextField
              placeholder="Buscar por nome ou e-mail..."
              size="small"
              sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: 400 } }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filtroStatusCadastro}
                label="Status"
                onChange={e => setFiltroStatusCadastro(e.target.value as any)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="cadastrado">Ativo</MenuItem>
                <MenuItem value="Inativo">Inativo</MenuItem>
                <MenuItem value="naoCadastrado">Não Cadastrado</MenuItem>
              </Select>
            </FormControl>

            <Button variant="outlined" onClick={() => {
              setSearch('')
              setFiltroStatusCadastro('todos')
            }}>
              Limpar
            </Button>
          </Box>

          {/* Tabela */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 4 }}>
              {error}
            </Alert>
          ) : (
            <Paper elevation={2} sx={{ overflowX: 'auto', borderRadius: 2 }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell padding="checkbox"><Checkbox /></TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Usuário</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Último Acesso</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProfessores.map(prof => (
                    <TableRow key={prof.transaction} hover>
                      <TableCell padding="checkbox"><Checkbox /></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#276678' }}>
                            {prof.buyerName?.[0] || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">{prof.buyerName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {prof.buyerEmail || '—'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={prof.roles?.[0] || 'Professor'} 
                          size="small" 
                          variant="outlined" 
                          color="primary" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            prof.jaCadastradoComoProfessor 
                              ? (prof.ativo ? 'Ativo' : 'Inativo') 
                              : 'Não cadastrado'
                          }
                          color={
                            prof.jaCadastradoComoProfessor 
                              ? (prof.ativo ? 'success' : 'error') 
                              : 'warning'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>Há 2 horas</TableCell>
                      <TableCell align="right">
                        {/* Coloque aqui seus botões de ação */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Componentes de feedback */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={5000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackSeverity} onClose={() => setSnackOpen(false)}>
          {snackMessage}
        </Alert>
      </Snackbar>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <ProfileUserAppEdit
          open={openModal}
          onClose={() => setOpenModal(false)}
          userId={selectedProfessor?.professorId!}
          initialData={initialData}
        />
      </Modal>
    </Box>
  )
}
