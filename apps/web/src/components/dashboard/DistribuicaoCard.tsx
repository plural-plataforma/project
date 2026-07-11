import { Box, Card, CardContent, LinearProgress, Typography } from '@mui/material';

export interface DistribuicaoItem {
  label: string;
  valor: number;
  /** Cor da barra (hex ou token do tema, ex: '#276678'). Default: primary.main */
  color?: string;
}

interface DistribuicaoCardProps {
  titulo: string;
  itens: DistribuicaoItem[];
  /** Total usado como base do percentual de cada barra. Default: soma dos itens. */
  total?: number;
}

/**
 * Card de breakdown (ex.: ativos vs inativos, por nível) usando LinearProgress
 * do MUI — sem depender de lib de gráficos.
 */
export default function DistribuicaoCard({ titulo, itens, total }: DistribuicaoCardProps) {
  const totalCalculado = total ?? itens.reduce((acc, item) => acc + item.valor, 0);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ px: 4, py: 3 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ letterSpacing: '0.4px', textTransform: 'uppercase', mb: 2 }}
        >
          {titulo}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {itens.map((item) => {
            const percentual = totalCalculado > 0 ? (item.valor / totalCalculado) * 100 : 0;
            return (
              <Box key={item.label}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    {item.valor.toLocaleString('pt-BR')}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={percentual}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: item.color ?? 'primary.main',
                    },
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
