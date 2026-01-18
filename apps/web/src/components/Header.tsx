import { Box, Typography, InputBase, alpha } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ButtonSvg from './button.svg' // seu botão original

export default function Header() {
  return (
    <Box
      sx={{
        border: '0px',
        display: 'flex',
        height: '96px',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        // width: '100%',
        maxWidth: 1120,
        //  height: 88,
        px: { xs: 2, lg: 4 },
        gap: { lg: '500.6px', md: 6, xs: 3 } // gap grande em desktop
      }}
    >
      {/* Esquerda: Título + Descrição */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          // mt: '16px',
          ml: { lg: '16px', xs: 0 },
          minWidth: 0 // evita overflow
        }}
      >
        <Typography
          sx={{
            color: '#276678',
            fontFamily: '"Inter", "Helvetica", sans-serif',
            fontWeight: 700,
            fontSize: { lg: 24, md: 22, xs: 20 },
            lineHeight: '32px',
            letterSpacing: '-0.5px',
            whiteSpace: 'nowrap'
          }}
        >
          Gerenciamento de Usuários
        </Typography>

        <Typography
          sx={{
            color: '#6B7280',
            fontFamily: '"Inter", "Helvetica", sans-serif',
            fontWeight: 400,
            fontSize: 14,
            lineHeight: '20px',
            letterSpacing: '-0.5px',
            whiteSpace: 'nowrap',
            display: { xs: 'none', md: 'block' }
          }}
        >
          Gerencie todos os usuários da plataforma Plural
        </Typography>
      </Box>

      {/* Direita: Busca + Botão */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          mt: '22px',
          flexShrink: 0
        }}
      >
        {/* Campo de busca */}
        <Box sx={{ position: 'relative', width: { xs: 240, sm: 256 } }}>
          {/* Input */}
          <InputBase
            placeholder="Buscar..."
            sx={{
              width: '100%',
              height: 42,
              pl: '40px',
              pr: 2,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: alpha('#276678', 0.42), // #2766786b ≈ 42% opacidade
              borderRadius: '8px',
              fontSize: 16,
              color: '#276678',
              '& input::placeholder': {
                color: '#ADAEBc',
                opacity: 1
              }
            }}
            startAdornment={
              <SearchIcon
                sx={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#276678',
                  fontSize: 18
                }}
              />
            }
          />
        </Box>
      </Box>
    </Box>
  )
}
