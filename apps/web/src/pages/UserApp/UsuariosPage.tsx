import { useState, useEffect } from 'react'
import axios from 'axios'
import { UsersListLayout } from '../../components/layouts/UsersListLayout'
import { Snackbar, Alert, Modal } from '@mui/material'
import ProfileUserAppEdit from './ProfileUserApp'
import { Usuario } from '../../types/userTypes'

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

export default function UsuariosPage() {
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
    <>
      <UsersListLayout
        professores={professores}
        filteredProfessores={filteredProfessores}
        loading={loading}
        error={error}
        search={search}
        filtroStatusCadastro={filtroStatusCadastro}
        setSearch={setSearch}
        setFiltroStatusCadastro={setFiltroStatusCadastro}
        totalCompradores={totalCompradores}
        cadastrados={cadastrados}
        naoCadastrados={naoCadastrados}
        cadastrandoEmail={cadastrandoEmail}
        onCadastrar={cadastrarProfessor}
        onVerPerfil={prof => {
          setSelectedProfessor(prof)
          setInitialData({
            idUsuario: prof.professorId,
            nome: prof.buyerName,
            email: prof.buyerEmail || '',
            telefone: prof.telefone,
            perfil: prof.roles[0],
            ativo: prof.ativo,
            idNivelEnsino: mapNivelToId(prof.nivelEnsino),
            isEmbaixadora: prof.isEmbaixadora
          })
          setOpenModal(true)
        }}
      />

      {/* Snackbar */}
      <Snackbar open={snackOpen} onClose={() => setSnackOpen(false)}>
        <Alert severity={snackSeverity}>{snackMessage}</Alert>
      </Snackbar>

      {/* Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <ProfileUserAppEdit
          open={openModal}
          onClose={() => setOpenModal(false)}
          userId={selectedProfessor?.professorId!}
          initialData={initialData}
        />
      </Modal>
    </>
  )
}
