// src/theme/theme.ts
//
// Fonte da verdade dos tokens de marca: packages/ui/theme/theme.tsx e
// apps/web-app/src/index.css (@theme do Tailwind 4). Aqui traduzimos os
// mesmos tokens (paleta, tipografia, raios, sombras) para o tema do MUI,
// mantendo o admin 100% MUI (sem portar Tailwind/Radix para este app).
import { createTheme, alpha } from '@mui/material/styles';

export const brand = {
  primary: '#276678',
  primaryDark: '#1e4d5c',
  primaryForeground: '#ffffff',
  amber: '#FFBE33',
  amberForeground: '#276678',
  purple: '#8B7BAB',
  success: '#28a745',
  danger: '#FF0000',
  warning: '#f59e0b',
  placeholder: '#ADAEBC',
  mutedForeground: '#9CA3AF',
} as const;

export const brandBorder = alpha(brand.primary, 0.42);

const theme = createTheme({
  palette: {
    primary: {
      main: brand.primary,
      dark: brand.primaryDark,
      light: alpha(brand.primary, 0.08),
      contrastText: brand.primaryForeground,
    },
    secondary: {
      main: brand.amber,
      contrastText: brand.amberForeground,
    },
    success: {
      main: brand.success,
    },
    error: {
      main: brand.danger,
    },
    warning: {
      main: brand.warning,
    },
    text: {
      primary: brand.primary,
      secondary: brand.mutedForeground,
    },
    divider: brandBorder,
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#F9FAFB' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${brandBorder}`,
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          '&:hover': { backgroundColor: brand.primaryDark },
        },
        outlinedPrimary: {
          borderColor: brandBorder,
          '&:hover': { borderColor: brand.primary, backgroundColor: alpha(brand.primary, 0.04) },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#fff',
          '& fieldset': { borderColor: brandBorder },
          '&:hover fieldset, &.Mui-focused fieldset': { borderColor: brandBorder },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${brandBorder}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: brand.primary,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: '#f9fafb',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: brand.primary,
        },
      },
    },
  },
});

export default theme;
