import { useState, useEffect } from 'react'
import axios from 'axios'
import { X } from '@phosphor-icons/react'
const API_URL = import.meta.env.VITE_API_URL

import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material'
import { Usuario } from '../../types/userTypes'

interface EditProfileModalProps {
  open: boolean
  onClose: () => void
  userId: number
  initialData?: Partial<Usuario>
}

export default function ProfileUserAppEdit({
  open,
  onClose,
  initialData
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<Partial<Usuario>>(initialData || {})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData)
      setLoading(false)
      return
    }
  }, [initialData])

  const handleSave = async () => {
    if (!formData.idUsuario) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      setError('Token não encontrado.')
      setSaving(false)
      return
    }

    const payload = {
      idUsuario: formData.idUsuario,
      acao: formData.ativo ? 'A' : 'I',
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone
    }

    try {
      await axios.patch(`${API_URL}/Admin/atualizarStatusUsuario`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      setSuccess(true)
      setTimeout(() => {
        onClose()
        window.location.reload()
      }, 1200)
    } catch (err: any) {
      setError(err.response?.objeto?.mensagens || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Usuario, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!open) return null

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 700 },
        bgcolor: 'background.paper',
        boxShadow: 40,
        p: 4,
        borderRadius: 2,
        maxHeight: '120vh',
        overflowY: 'auto'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Editar Perfil de {formData.nome || 'Usuário'}
        </Typography>
        <Button onClick={onClose} sx={{ minWidth: 'auto' }}>
          <X size={24} weight="bold" />
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Perfil atualizado com sucesso!
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {/* Nome */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Nome completo"
              fullWidth
              value={formData.nome || ''}
              onChange={e => handleChange('nome', e.target.value)}
              required
            />
          </Grid>

          {/* Email */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="E-mail"
              fullWidth
              type="email"
              value={formData.email || ''}
              onChange={e => handleChange('email', e.target.value)}
              required
            />
          </Grid>

          {/* Telefone */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Telefone / WhatsApp"
              fullWidth
              value={formData.telefone || ''}
              onChange={e => handleChange('telefone', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </Grid>

          {/* Perfil */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Perfil</InputLabel>
              <Select
                value={formData.perfil || ''}
                label="Perfil"
                onChange={e => handleChange('perfil', e.target.value)}
              >
                <MenuItem value="ADMIN">Administrador</MenuItem>
                <MenuItem value="PROFESSOR">Professor</MenuItem>
                <MenuItem value="RESPONSAVEL">Responsável</MenuItem>
                <MenuItem value="OUTRO">Outro</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Status Ativo */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={
                  formData.ativo !== undefined ? String(formData.ativo) : 'true'
                }
                label="Status"
                onChange={e => handleChange('ativo', e.target.value === 'true')}
              >
                <MenuItem value="true">Ativo</MenuItem>
                <MenuItem value="false">Inativo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Botões */}
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                mt: 2
              }}
            >
              <Button variant="outlined" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={
                  saving || !formData.nome?.trim() || !formData.email?.trim()
                }
                sx={{ backgroundColor: '#276678' }}
              >
                {saving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
