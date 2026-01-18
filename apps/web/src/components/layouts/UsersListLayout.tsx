import {
  Box,
  Paper,
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
  Chip
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import InfoCard from '../InfoCard'

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

interface Props {
  professores: Professor[]
  filteredProfessores: Professor[]
  loading: boolean
  error: string | null
  search: string
  filtroStatusCadastro: string
  setSearch: (v: string) => void
  setFiltroStatusCadastro: (v: any) => void
  totalCompradores: number
  cadastrados: number
  naoCadastrados: number
  cadastrandoEmail: string | null
  onCadastrar: (email: string, nome: string) => void
  onVerPerfil: (prof: Professor) => void
}

export function UsersListLayout({
  filteredProfessores,
  loading,
  error,
  search,
  filtroStatusCadastro,
  setSearch,
  setFiltroStatusCadastro,
  totalCompradores,
  cadastrados,
  naoCadastrados,
  cadastrandoEmail,
  onCadastrar,
  onVerPerfil
}: Props) {
  return (
    <>
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
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          size="small"
          label="Buscar por nome ou e-mail"
          value={search}
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
      </Box>

      {/* Tabela */}
      {loading ? (
        <Box textAlign="center" my={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper elevation={3}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Transação</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ação</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredProfessores.map(prof => (
                <TableRow key={prof.transaction} hover>
                  <TableCell>{prof.transaction}</TableCell>
                  <TableCell>{prof.buyerName}</TableCell>
                  <TableCell>{prof.buyerEmail || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
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
                    />
                  </TableCell>

                  <TableCell align="center">
                    {prof.jaCadastradoComoProfessor ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => onVerPerfil(prof)}
                      >
                        Ver Perfil
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={
                          cadastrandoEmail === prof.buyerEmail ||
                          !prof.buyerEmail
                        }
                        onClick={() =>
                          onCadastrar(prof.buyerEmail!, prof.buyerName)
                        }
                      >
                        {cadastrandoEmail === prof.buyerEmail
                          ? '...'
                          : 'Cadastrar'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </>
  )
}
