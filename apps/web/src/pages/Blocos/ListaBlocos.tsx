'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Avatar,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as ExportIcon,
  MoreVert as MoreVertIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Dados mock (substitua por chamada à API depois)
const mockBlocos = [
  { id: 1, titulo: 'Alfabeto', ordem: 1, atividades: 28, createdAt: '15/01/2024', status: 'ativo', icone: '' },
  { id: 2, titulo: 'Leitura', ordem: 2, atividades: 35, createdAt: '18/01/2024', status: 'ativo', icone: '' },
  { id: 3, titulo: 'Percepção Visual', ordem: 3, atividades: 19, createdAt: '22/01/2024', status: 'ativo', icone: '' },
  { id: 4, titulo: 'Matemática Básica', ordem: 4, atividades: 42, createdAt: '25/01/2024', status: 'ativo', icone: '' },
  { id: 5, titulo: 'Cores e Formas', ordem: 5, atividades: 15, createdAt: '28/01/2024', status: 'inativo', icone: '' },
  { id: 6, titulo: 'Memória e Concentração', ordem: 6, atividades: 24, createdAt: '02/02/2024', status: 'ativo', icone: '' },
];
interface ListaBlocosProps {
  search: string;
  statusFilter: 'todos' | 'ativos' | 'inativos';
}

export default function ListaBlocos({ search, statusFilter }: ListaBlocosProps) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 10; // ajuste conforme necessário
  const navigate = useNavigate();

  const filteredBlocos = mockBlocos.filter(bloco => {
    const matchSearch = bloco.titulo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = 
      statusFilter === 'todos' ||
      (statusFilter === 'ativos' && bloco.status === 'ativo') ||
      (statusFilter === 'inativos' && bloco.status === 'inativo');
    
    return matchSearch && matchStatus;
  });


  const handleNovoBloco = () => {
    navigate('/blocos/novo');
  };

  const handleExportar = useCallback(() => {
    console.log('Exportar lista de blocos');
  }, []);

  const handleRowClick = useCallback((id: number) => {
    console.log(`Abrir detalhes do bloco ${id}`);
  }, []);

  const handleAcoesClick = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    console.log(`Ações para bloco ${id}`);
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(39, 102, 120, 0.42)',
        borderRadius: '12px',
        overflow: 'hidden',
        height: '100%',
        minHeight: '658px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cabeçalho */}
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            component="h1"
            fontWeight={600}
            color="#276678"
            sx={{ letterSpacing: '-0.5px' }}
          >
            Lista de Blocos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie todos os blocos de atividades do sistema
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportar}
            sx={{
              borderColor: 'rgba(39, 102, 120, 0.42)',
              color: '#276678',
              '&:hover': {
                borderColor: 'rgba(39, 102, 120, 0.42)',
                bgcolor: 'rgba(39, 102, 120, 0.04)',
              },
            }}
          >
            Exportar
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNovoBloco}
            sx={{
              bgcolor: '#276678',
              '&:hover': { bgcolor: '#1e4d5a' },
            }}
          >
            Novo Bloco
          </Button>
        </Box>
      </Box>

      {/* Tabela */}
      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}>
              <TableCell sx={{ pl: 4, fontWeight: 600, color: '#276678' }}>
                Nome do Bloco
                <ArrowDropDownIcon sx={{ ml: 1, fontSize: 'small', verticalAlign: 'middle' }} />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#276678' }}>
                Ordem
                <ArrowDropDownIcon sx={{ ml: 1, fontSize: 'small', verticalAlign: 'middle' }} />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#276678' }}>Atividades</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#276678' }}>Status</TableCell>
              <TableCell align="right" sx={{ pr: 4, fontWeight: 600, color: '#276678' }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {mockBlocos.map((bloco) => (
              <TableRow
                key={bloco.id}
                hover
                onClick={() => handleRowClick(bloco.id)}
                sx={{
                  cursor: 'pointer',
                  '&:last-child td, &:last-child th': { border: 0 },
                  borderBottom: '1px solid #e5e7eb',
                  height: 73,
                }}
              >
                <TableCell sx={{ pl: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      variant="rounded"
                      sx={{ width: 40, height: 40, bgcolor: 'grey.200' }}
                    >
                      {/* Aqui vai o ícone real do bloco */}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight={600} color="#276678">
                        {bloco.titulo}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Criado em {bloco.createdAt}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box
                    sx={{
                      bgcolor: '#f3f4f6',
                      borderRadius: '8px',
                      width: 42,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {bloco.ordem}
                  </Box>
                </TableCell>

                <TableCell sx={{ fontWeight: 500 }}>
                  {bloco.atividades} atividades
                </TableCell>

                <TableCell>
                  <Chip
                    label={bloco.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    size="small"
                    sx={{
                      bgcolor: bloco.status === 'ativo' ? '#dcfce7' : '#f3f4f6',
                      color: bloco.status === 'ativo' ? '#15803d' : '#4b5563',
                      fontWeight: 500,
                      '& .MuiChip-label': {
                        px: 2,
                      },
                    }}
                  />
                </TableCell>

                <TableCell align="right" sx={{ pr: 4 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleAcoesClick(e, bloco.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação e contador */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Mostrando <strong>6</strong> de <strong>24</strong> blocos
        </Typography>

        <Pagination
          count={3} // calcular com base no total real
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          sx={{
            '& .MuiPaginationItem-root': {
              borderRadius: '8px',
            },
            '& .Mui-selected': {
              bgcolor: '#276678 !important',
              color: 'white',
            },
          }}
        />
      </Box>
    </Paper>
  );
}