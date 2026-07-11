import { Box, Chip, Divider, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';
import type { ChipProps } from '@mui/material';

export interface ListaRecenteItem {
  id: number | string;
  primary: string;
  secondary: string;
  chipLabel: string;
  chipColor?: ChipProps['color'];
}

interface ListaRecenteProps {
  titulo: string;
  itens: ListaRecenteItem[];
  emptyMessage: string;
}

/** Lista simples (últimos N registros) reutilizada nas seções "recentes" do Dashboard. */
export default function ListaRecente({ titulo, itens, emptyMessage }: ListaRecenteProps) {
  return (
    <Paper elevation={0} sx={{ height: '100%' }}>
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="h6" color="primary.main" fontWeight={700}>
          {titulo}
        </Typography>
      </Box>
      <Divider />
      {itens.length === 0 ? (
        <Box sx={{ px: 3, py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {itens.map((item, index) => (
            <Box key={item.id}>
              <ListItem sx={{ px: 3, py: 1.5 }}>
                <ListItemText primary={item.primary} secondary={item.secondary} />
                <Chip label={item.chipLabel} size="small" color={item.chipColor ?? 'default'} />
              </ListItem>
              {index < itens.length - 1 && <Divider component="li" />}
            </Box>
          ))}
        </List>
      )}
    </Paper>
  );
}
