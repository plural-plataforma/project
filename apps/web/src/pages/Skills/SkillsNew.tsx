// pages/SkillsNew.tsx
import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

import {
  Box,
  Paper,
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

interface HabilidadeForm {
  tipo: number | ''
  descricao: string
  resumo: string
  idNivelEnsino: number | ''
  ativo: boolean   // mantido no form, mas não enviado no payload
}

export default function SkillsNew() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState<HabilidadeForm>({
    tipo: '',
    descricao: '',
    resumo: '',
    idNivelEnsino: '',
    ativo: true
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    // Validação básica no frontend
    if (!formData.descricao.trim()) {
      setError('A descrição é obrigatória.')
      return
    }
    if (formData.tipo === '') {
      setError('O tipo da habilidade é obrigatório.')
      return
    }
    if (formData.idNivelEnsino === '') {
      setError('O nível de ensino é obrigatório.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      setError('Token não encontrado. Faça login novamente.')
      setSaving(false)
      return
    }

    const payload = {
      id: 0,                           // conforme exemplo da API
      idNivelEnsino: String(formData.idNivelEnsino),
      tipo: String(formData.tipo),
      descricao: formData.descricao.trim(),
      resumo: formData.resumo.trim()
      // ativo NÃO está sendo enviado, pois não aparece no schema
    }

    try {
      await axios.post(`${API_URL}/Habilidade/cadastro`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      setSuccess(true)
      setTimeout(() => {
        navigate('/skills')
      }, 1800)
    } catch (err: any) {
      console.error('Erro ao criar habilidade:', err)
      const mensagemErro =
        err.response?.data?.mensagem ||
        err.response?.data?.title ||
        err.response?.data?.detail ||
        err.message ||
        'Erro ao cadastrar a habilidade. Verifique os dados e tente novamente.'
      setError(mensagemErro)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof HabilidadeForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          flex: 1
        }}
      >
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              variant="outlined"
            >
              Voltar
            </Button>
            <Typography variant="h5" fontWeight="bold" color="#276678">
              Nova Habilidade
            </Typography>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Habilidade cadastrada com sucesso! Redirecionando...
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Paper sx={{ p: 4, borderRadius: '12px' }}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <TextField
                  label="Descrição"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.descricao}
                  onChange={e => handleChange('descricao', e.target.value)}
                  required
                  error={!!error && !formData.descricao.trim()}
                  helperText={!!error && !formData.descricao.trim() ? 'Campo obrigatório' : ''}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  label="Resumo"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.resumo}
                  onChange={e => handleChange('resumo', e.target.value)}
                  placeholder="Breve descrição do que a habilidade envolve (opcional)"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required error={!!error && formData.tipo === ''}>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={formData.tipo}
                    label="Tipo"
                    onChange={e => handleChange('tipo', e.target.value)}
                  >
                    <MenuItem value=""><em>Selecione o tipo</em></MenuItem>
                    <MenuItem value={1}>Cognitivo</MenuItem>
                    <MenuItem value={2}>Socioemocional</MenuItem>
                    <MenuItem value={3}>Comunicação</MenuItem>
                    <MenuItem value={4}>Motora</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required error={!!error && formData.idNivelEnsino === ''}>
                  <InputLabel>Nível de Ensino</InputLabel>
                  <Select
                    value={formData.idNivelEnsino}
                    label="Nível de Ensino"
                    onChange={e => handleChange('idNivelEnsino', e.target.value)}
                  >
                    <MenuItem value=""><em>Selecione o nível</em></MenuItem>
                    <MenuItem value={1}>Educação Infantil</MenuItem>
                    <MenuItem value={2}>Ensino Fundamental I - Anos Iniciais</MenuItem>
                    <MenuItem value={3}>Ensino Fundamental II - Anos Finais</MenuItem>
                    <MenuItem value={4}>Ensino Médio</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Ativo</InputLabel>
                  <Select
                    value={String(formData.ativo)}
                    label="Ativo"
                    onChange={e => handleChange('ativo', e.target.value === 'true')}
                  >
                    <MenuItem value="true">Sim</MenuItem>
                    <MenuItem value="false">Não</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate(-1)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ bgcolor: '#276678', '&:hover': { bgcolor: '#1e4d5c' } }}
                  >
                    {saving ? <CircularProgress size={24} color="inherit" /> : 'Cadastrar Habilidade'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}