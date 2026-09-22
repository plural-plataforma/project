import { Box, Card, CardContent, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export interface BarraItem {
  /** Chave estável do item (ex.: data ISO, hora). */
  chave: string;
  valor: number;
  /** Rótulo exibido abaixo da barra — omitir para esconder (séries longas). */
  rotuloEixo?: string;
  /** Conteúdo do tooltip. Default: valor. */
  detalhe?: ReactNode;
  /** Cor da barra. Default: primary.main */
  color?: string;
}

interface BarrasCardProps {
  titulo: string;
  itens: BarraItem[];
  altura?: number;
  vazio?: string;
}

/**
 * Série de barras verticais (ex.: gerações por dia/hora) montada com Box do MUI — mesma
 * abordagem do DistribuicaoCard, sem depender de lib de gráficos.
 */
export default function BarrasCard({ titulo, itens, altura = 160, vazio = 'Sem dados no período.' }: BarrasCardProps) {
  const maximo = itens.reduce((acc, item) => Math.max(acc, item.valor), 0);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ px: 4, py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ letterSpacing: '0.4px', textTransform: 'uppercase' }}
          >
            {titulo}
          </Typography>
          {maximo > 0 && (
            <Typography variant="caption" color="text.secondary">
              pico: {maximo.toLocaleString('pt-BR')}
            </Typography>
          )}
        </Box>

        {maximo === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            {vazio}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: altura }}>
            {itens.map((item) => (
              <Tooltip key={item.chave} title={item.detalhe ?? item.valor.toLocaleString('pt-BR')} arrow>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    cursor: 'default',
                    '&:hover > .barra': { opacity: 0.8 },
                  }}
                  aria-label={`${item.rotuloEixo ?? item.chave}: ${item.valor}`}
                >
                  <Box
                    className="barra"
                    sx={{
                      width: '100%',
                      height: `${(item.valor / maximo) * 100}%`,
                      minHeight: item.valor > 0 ? 2 : 0,
                      borderRadius: '3px 3px 0 0',
                      bgcolor: item.color ?? 'primary.main',
                    }}
                  />
                </Box>
              </Tooltip>
            ))}
          </Box>
        )}

        {maximo > 0 && itens.some((item) => item.rotuloEixo) && (
          <Box sx={{ display: 'flex', gap: '2px', mt: 0.5 }}>
            {itens.map((item) => (
              <Typography
                key={item.chave}
                variant="caption"
                color="text.secondary"
                sx={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 10, whiteSpace: 'nowrap', overflow: 'visible' }}
              >
                {item.rotuloEixo ?? ''}
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
