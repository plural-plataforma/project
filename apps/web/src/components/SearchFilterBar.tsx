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
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
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
  statusFilter: TStatus;
  setStatusFilter: (value: TStatus) => void;
  statusOptions: Array<{ value: TStatus; label: string }>;
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
    setStatusFilter(e.target.value as TStatus);
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        px: { xs: 2, md: 4 },
        paddingTop: 3,
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 2, md: 3 },
          width: '100%',
          maxWidth: '100%',
          flexWrap: 'wrap',
          bgcolor: 'background.paper',
          p: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {/* Campo de busca */}
        <TextField
          placeholder={placeholder}
          value={search}
          onChange={handleSearchChange}
          fullWidth
          sx={{
            maxWidth: { xs: '100%', md: '85%' },
            '& .MuiOutlinedInput-root': { height: 50 },
            '& .MuiInputBase-input': {
              color: 'primary.main',
              pl: 5,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Filtro de Status */}
        <FormControl sx={{ minWidth: 200 }}>
          <Select
            value={statusFilter}
            onChange={handleStatusChange}
            displayEmpty
            IconComponent={KeyboardArrowDownIcon}
            sx={{
              height: 50,
              color: 'primary.main',
            }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filtro de Expiração */}
        {setExpirationFilter && (
          <FormControl sx={{ minWidth: 200 }}>
            <Select
              value={expirationFilter ?? 'todos'}
              onChange={(e) => setExpirationFilter(e.target.value as FiltroExpiracao)}
              displayEmpty
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                height: 50,
                backgroundColor: expirationFilter && expirationFilter !== 'todos' ? 'warning.light' : undefined,
                color: expirationFilter && expirationFilter !== 'todos' ? 'warning.dark' : 'primary.main',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: expirationFilter && expirationFilter !== 'todos'
                    ? 'warning.main'
                    : undefined,
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

        {/* Botão de filtros avançados (mantido como placeholder) 
        <Button
          variant="outlined"
          startIcon={<FilterListIcon sx={{ color: '#276678' }} />}
          sx={{
            height: 50,
            borderRadius: '8px',
            borderColor: 'rgba(39, 102, 120, 0.42)',
            color: '#276678',
            textTransform: 'none',
            fontWeight: 500,
            px: 3,
            '&:hover': {
              borderColor: 'rgba(39, 102, 120, 0.42)',
              backgroundColor: 'rgba(39, 102, 120, 0.04)',
            },
          }}
          onClick={() => alert('Filtros avançados ainda não implementados')}
        >
          Filtros
        </Button>*/}
      </Box>
    </Box>
  );
}