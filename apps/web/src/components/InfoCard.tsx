import { Box, Card, CardContent, Typography, Avatar } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'

interface InfoCardProps {
  titulo: string
  valor: string | number
  variacao?: string // ex: "+12%", "-8%", "0%"
  icone: ReactNode
  corFundoIcone?: string
  corIcone?: string
}

export default function InfoCard({
  titulo,
  valor,
  variacao = '',
  icone,
  corFundoIcone,
  corIcone
}: InfoCardProps) {
  const theme = useTheme()

  const variacaoNormalizada = variacao.trim()

  const isPositiva = variacaoNormalizada.startsWith('+')
  const isNegativa = variacaoNormalizada.startsWith('-')
  const isNeutra = !isPositiva && !isNegativa

  const corVariacao = isPositiva
    ? theme.palette.success.main
    : isNegativa
      ? theme.palette.error.main
      : theme.palette.text.secondary

  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        height: '100%',
        position: 'relative',
        transition: 'all 0.25s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: theme.shadows[10]
        },
        '&:hover .info-card-icon': {
          transform: 'scale(1.08)'
        }
      }}
    >
      {/* Ícone */}
      <Box
        className="info-card-icon"
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          bgcolor: corFundoIcone ?? theme.palette.primary.light,
          borderRadius: '50%',
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme.shadows[4],
          transition: 'transform 0.25s ease'
        }}
      >
        <Avatar
          aria-hidden
          sx={{
            bgcolor: corIcone ?? theme.palette.primary.main,
            width: 42,
            height: 42,
            fontSize: '1.6rem'
          }}
        >
          {icone}
        </Avatar>
      </Box>

      <CardContent sx={{ p: 4, pt: 9, pb: 5 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{
            mb: 1,
            fontWeight: 600,
            letterSpacing: '0.4px',
            textTransform: 'uppercase'
          }}
        >
          {titulo}
        </Typography>

        <Typography
          variant="h4"
          component="div"
          fontWeight="bold"
          color="primary.main"
          sx={{ mb: 0.5, lineHeight: 1.1 }}
        >
          {valor}
        </Typography>

        {variacao && (
          <Typography
            variant="body2"
            sx={{
              color: corVariacao,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              letterSpacing: '0.3px'
            }}
          >
            {!isNeutra && (isPositiva ? '↑' : '↓')} {variacao}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
