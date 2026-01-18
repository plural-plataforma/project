import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Avatar,
  Stack,
  Divider
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import PsychologyIcon from '@mui/icons-material/Psychology'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import StorageIcon from '@mui/icons-material/Storage'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'

// Dados mock (substitua por API depois)
const stats = [
  {
    title: 'Total Usuários',
    value: '2.847',
    change: '+12% este mês',
    icon: <PeopleIcon />,
    color: '#4CAF50',
    bg: '#E8F5E9'
  },
  {
    title: 'Habilidades Ativas',
    value: '156',
    change: '+3 esta semana',
    icon: <PsychologyIcon />,
    color: '#9C27B0',
    bg: '#F3E5F5'
  },
  {
    title: 'Avaliações Realizadas',
    value: '1.234',
    change: '+8% esta semana',
    icon: <CheckCircleIcon />,
    color: '#2196F3',
    bg: '#E3F2FD'
  },
  {
    title: 'Atividades Cadastradas',
    value: '892',
    change: '+15 esta semana',
    icon: <StorageIcon />,
    color: '#FF9800',
    bg: '#FFF3E0'
  }
]

const users = [
  {
    name: 'João Silva',
    role: 'Professor',
    status: 'Ativo',
    avatar: 'https://i.pravatar.cc/48?u=joao',
    color: 'success'
  },
  {
    name: 'Maria Santos',
    role: 'Coordenadora',
    status: 'Ativo',
    avatar: 'https://i.pravatar.cc/48?u=maria',
    color: 'success'
  },
  {
    name: 'Pedro Costa',
    role: 'Aluno',
    status: 'Inativo',
    avatar: 'https://i.pravatar.cc/48?u=pedro',
    color: 'error'
  }
]

const skills = [
  {
    name: 'Leitura e Interpretação',
    info: 'Português - 5º ano',
    status: 'Ativa'
  },
  { name: 'Operações Básicas', info: 'Matemática - 4º ano', status: 'Ativa' },
  {
    name: 'Resolução de Problemas',
    info: 'Matemática - 6º ano',
    status: 'Revisão'
  }
]

const blocks = [
  {
    title: 'Bloco Fundamental I',
    questions: 12,
    desc: 'Avaliação para 1º ao 5º ano do ensino fundamental',
    updated: '15/01/2024'
  },
  {
    title: 'Bloco Fundamental II',
    questions: 18,
    desc: 'Avaliação para 6º ao 9º ano do ensino fundamental',
    updated: '10/01/2024'
  }
]

const activities = [
  {
    title: 'Interpretação de Texto',
    subject: 'Português',
    desc: 'Atividade de múltipla escolha sobre compreensão textual',
    difficulty: 'Médio'
  },
  {
    title: 'Equações do 1º Grau',
    subject: 'Matemática',
    desc: 'Exercícios práticos de resolução de equações',
    difficulty: 'Fácil'
  }
]

export default function Dashboard() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Cards de Estatísticas - 4 colunas em desktop */}
      <Grid container spacing={3} mb={5}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card
              elevation={3}
              sx={{
                height: '100%',
                borderRadius: 3,
                bgcolor: stat.bg,
                color: stat.color,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: 'text.secondary' }}
                  >
                    {stat.title}
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: 'white',
                      borderRadius: '50%',
                      p: 1,
                      display: 'flex'
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Stack>
                <Typography variant="h4" fontWeight="bold" mb={1}>
                  {stat.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: stat.color, fontWeight: 500 }}
                >
                  {stat.change}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Seções de Gerenciamento - 2 colunas */}
      <Grid container spacing={4}>
        {/* Gerenciamento de Usuários */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6" fontWeight="bold" color="#276678">
                  Gerenciamento de Usuários
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="medium"
                  sx={{
                    borderRadius: '8px',
                    color: { primary: '#3B82F6', contrastText: '#FFF' }
                  }}
                >
                  Novo Usuário
                </Button>
              </Stack>

              <Stack spacing={2}>
                {users.map((user, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar src={user.avatar} alt={user.name} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {user.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.role}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={user.status}
                        size="small"
                        color={user.status === 'Ativo' ? 'success' : 'error'}
                      />
                      <IconButton size="small">
                        <MoreHorizIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Habilidades */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6" fontWeight="bold" color="#276678">
                  Habilidades
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  color="secondary"
                  size="small"
                >
                  Nova Habilidade
                </Button>
              </Stack>

              <Stack spacing={2}>
                {skills.map((skill, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {skill.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {skill.info}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Chip label={skill.status} size="small" color="primary" />
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Blocos de Avaliação */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6" fontWeight="bold" color="#276678">
                  Blocos de Avaliação
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  color="success"
                  size="small"
                >
                  Novo Bloco
                </Button>
              </Stack>

              <Stack spacing={3} divider={<Divider />}>
                {blocks.map((block, i) => (
                  <Box key={i}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      mb={1}
                    >
                      <Typography variant="subtitle1" fontWeight={600}>
                        {block.title}
                      </Typography>
                      <Chip
                        label={`${block.questions} questões`}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {block.desc}
                    </Typography>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="caption" color="text.secondary">
                        Última atualização: {block.updated}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Banco de Atividades */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6" fontWeight="bold" color="#276678">
                  Banco de Atividades
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  color="warning"
                  size="small"
                >
                  Nova Atividade
                </Button>
              </Stack>

              <Stack spacing={3} divider={<Divider />}>
                {activities.map((act, i) => (
                  <Box key={i}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      mb={1}
                    >
                      <Typography variant="subtitle1" fontWeight={600}>
                        {act.title}
                      </Typography>
                      <Chip label={act.subject} size="small" color="info" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {act.desc}
                    </Typography>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="caption" color="text.secondary">
                        Dificuldade: {act.difficulty}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
