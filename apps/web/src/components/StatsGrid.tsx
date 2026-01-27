// components/StatsGrid.tsx
import { Box, Card, CardContent, Grid, GridProps, Typography, Avatar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { ReactNode } from 'react';

export interface StatCardData {
  titulo: string;
  valor: string | number;
  variacao?: string;
  icone: ReactNode;
  corFundoIcone?: string;
  corIcone?: string;
  destaque?: boolean; // opcional, não usado no visual atual
}

interface InfoCardProps extends StatCardData {}

function InfoCard({
  titulo,
  valor,
  variacao = '',
  icone,
  corFundoIcone,
  corIcone,
}: InfoCardProps) {
  const theme = useTheme();

  const variacaoNormalizada = variacao.trim();
  const isPositiva = variacaoNormalizada.startsWith('+');
  const isNegativa = variacaoNormalizada.startsWith('-');
  const isNeutra = !isPositiva && !isNegativa;

  const corVariacao = isPositiva
    ? theme.palette.success.main
    : isNegativa
      ? theme.palette.error.main
      : theme.palette.text.secondary;

  return (
    <Card
      sx={{
        border: '1px solid rgba(39, 102, 120, 0.42)',
        background: '#FFF',
        borderRadius: '12px',
        overflow: 'hidden',
        height: '100%',
        // Sem sombra, sem hover, sem transição
      }}
    >
      {/* Cabeçalho: título + ícone na mesma linha */}
      <Box
        sx={{
          px: 4,
          pt: 3,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{
            fontWeight: 600,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          }}
        >
          {titulo}
        </Typography>

        <Box
          sx={{
            bgcolor: corFundoIcone ?? 'rgba(39,102,120,0.08)',
            borderRadius: '8px',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Avatar
            sx={{
              bgcolor: 'transparent',
              color: corIcone ?? '#276678',
              width: 32,
              height: 32,
            }}
          >
            {icone}
          </Avatar>
        </Box>
      </Box>

      <CardContent sx={{ px: 4, py: 1, pt: 0 }}>
        <Typography
          variant="h4"
          component="div"
          fontWeight="bold"
          sx={{
            color: '#276678',
            mb: 0.5,
            lineHeight: 1.1,
          }}
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
            }}
          >
            {!isNeutra && (isPositiva ? '↑' : '↓')} {variacao}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  cards: StatCardData[];
  spacing?: number;
  containerProps?: GridProps;
}

export default function StatsGrid({
  cards,
  spacing = 3,
  containerProps,
}: StatsGridProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={spacing} {...containerProps}>
        {cards.map((card, index) => (
          <Grid
            size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
            key={index}
          >
            <InfoCard {...card} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}