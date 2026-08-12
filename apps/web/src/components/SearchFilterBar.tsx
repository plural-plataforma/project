// components/SearchFilterBar.tsx
import { ChangeEvent } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export type FiltroExpiracao = 'todos' | 'expirado' | '30' | '60' | '90'

const EXPIRACAO_OPTIONS: Array<{ value: FiltroExpiracao; label: string }> = [
  { value: 'todos', label: 'Todas as expirações' },
  { value: 'expirado', label: 'Expirado' },
  { value: '30', label: 'Expira em 30 dias' },
  { value: '60', label: 'Expira em 60 dias' },
  { value: '90', label: 'Expira em 90 dias' },
]

interface SearchFilterBarProps<TStatus extends string> {
  search: string;
  setSearch: (value: string) => void;
  statusFilter?: TStatus;
  setStatusFilter?: (value: TStatus) => void;
  statusOptions?: Array<{ value: TStatus; label: string }>;
  placeholder?: string;
  expirationFilter?: FiltroExpiracao;
  setExpirationFilter?: (value: FiltroExpiracao) => void;
}

export default function SearchFilterBar<TStatus extends string>({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  statusOptions,
  placeholder = 'Buscar por nome ou e-mail...',
  expirationFilter,
  setExpirationFilter,
}: SearchFilterBarProps<TStatus>) {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setStatusFilter?.(e.target.value as TStatus);
  };

  const inputSx = {
    height: 44,
    borderRadius: '10px',
    fontSize: 14,
    bgcolor: 'background.paper',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main', borderWidth: '1.5px' },
  } as const;

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        px: { xs: 2, md: 4 },
        pt: 3,
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        {/* Campo de busca */}
        <TextField
          placeholder={placeholder}
          value={search}
          onChange={handleSearchChange}
          fullWidth
          sx={{
            maxWidth: { xs: '100%', md: 380 },
            '& .MuiOutlinedInput-root': inputSx,
            '& .MuiInputBase-input': { color: 'text.primary' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Filtro de Status */}
        {statusOptions && statusFilter !== undefined && (
          <FormControl sx={{ minWidth: 160 }}>
            <Select
              value={statusFilter}
              onChange={handleStatusChange}
              displayEmpty
              IconComponent={KeyboardArrowDownIcon}
              sx={{ ...inputSx, color: 'text.primary' }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Filtro de Expiração */}
        {setExpirationFilter && (
          <FormControl sx={{ minWidth: 180 }}>
            <Select
              value={expirationFilter ?? 'todos'}
              onChange={(e) => setExpirationFilter(e.target.value as FiltroExpiracao)}
              displayEmpty
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                ...inputSx,
                bgcolor: expirationFilter && expirationFilter !== 'todos' ? 'warning.light' : inputSx.bgcolor,
                color: expirationFilter && expirationFilter !== 'todos' ? 'warning.dark' : 'text.primary',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: expirationFilter && expirationFilter !== 'todos'
                    ? 'warning.main'
                    : 'divider',
                },
              }}
            >
              {EXPIRACAO_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    </Box>
  );
}