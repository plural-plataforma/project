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

interface SearchFilterBarProps<TStatus extends string> {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: TStatus;
  setStatusFilter: (value: TStatus) => void;
  statusOptions: Array<{ value: TStatus; label: string }>;
  placeholder?: string;
}

export default function SearchFilterBar<TStatus extends string>({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  statusOptions,
  placeholder = 'Buscar por nome ou e-mail...',
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
        bgcolor: 'grey.50',
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
          bgcolor: '#FFFFFF',
          p: 2,
          borderRadius: '12px',
          border: '1px solid rgba(39, 102, 120, 0.42)',
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
            maxWidth: { xs: '100%', md: '85%'},
            '& .MuiOutlinedInput-root': {
              height: 50,
              borderRadius: '8px',
              backgroundColor: '#fff',
              '& fieldset': { borderColor: 'rgba(39, 102, 120, 0.42)' },
              '&:hover fieldset, &.Mui-focused fieldset': {
                borderColor: 'rgba(39, 102, 120, 0.42)',
              },
            },
            '& .MuiInputBase-input': {
              color: '#276678',
              pl: 5,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Filtro de Status */}
        <FormControl sx={{ minWidth: 250 }}>
          <Select
            value={statusFilter}
            onChange={handleStatusChange}
            displayEmpty
            IconComponent={KeyboardArrowDownIcon}
            sx={{
              height: 50,
              borderRadius: '8px',
              backgroundColor: '#fff',
              color: '#276678',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(39, 102, 120, 0.42)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline, &.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(39, 102, 120, 0.42)',
              },
            }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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