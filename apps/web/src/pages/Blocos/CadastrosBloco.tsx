'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  IconButton,
  Chip,
  Alert,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberedListIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

export default function CadastroBloco() {
  const [titulo, setTitulo] = useState('Resolução de Problemas com Frações');
  const [ordem, setOrdem] = useState('1');
  const [observacoes, setObservacoes] = useState(
    'Maria comprou 3/4 de um bolo de chocolate e João comprou 2/5 de um bolo de morango. Quem comprou mais bolo? Justifique sua resposta mostrando os cálculos.'
  );
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');

  const [error, setError] = useState<string | null>(null);

  const handleVoltar = useCallback(() => {
    // Aqui você pode usar useRouter() do next/navigation para voltar
    window.history.back();
  }, []);

  const handleSalvar = useCallback(() => {
    if (!titulo.trim()) {
      setError('O título é obrigatório');
      return;
    }
    if (!ordem) {
      setError('A ordem é obrigatória');
      return;
    }

    setError(null);
    console.log('Salvando bloco:', { titulo, ordem, observacoes, status });
    // Aqui você faria a chamada para a API (POST ou PUT)
  }, [titulo, ordem, observacoes, status]);

  const handleExcluir = useCallback(() => {
    if (window.confirm('Deseja realmente excluir este bloco?')) {
      console.log('Excluir bloco');
      // chamada API DELETE
    }
  }, []);

  return (
    <Box sx={{ bgcolor: '#f9fafb', minHeight: '100vh', py: 3 }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: 960,
          mx: 'auto',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 4,
            py: 2,
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleVoltar} size="large">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight={600} color="#276678">
              Cadastro de Bloco de Avaliação
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Última modificação: 15/01/2024
            </Typography>
            <Chip
              label="JD"
              size="small"
              sx={{
                bgcolor: '#3b82f6',
                color: 'white',
                fontWeight: 500,
                width: 32,
                height: 32,
              }}
            />
          </Box>
        </Box>

        {/* Conteúdo Principal */}
        <Box sx={{ p: 4 }}>
          {/* Cabeçalho da seção */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" fontWeight={600} color="#276678">
                Dados do Bloco
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Preencha as informações básicas do bloco
              </Typography>
            </Box>

            <Chip
              label="Ativo"
              color="success"
              size="small"
              sx={{ bgcolor: '#dcfce7', color: '#166534' }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Formulário */}
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Título + Ordem */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <FormControl sx={{ flex: 1, minWidth: 300 }}>
                <FormLabel required>Título</FormLabel>
                <TextField
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Resolução de Problemas com Frações"
                  fullWidth
                  variant="outlined"
                  size="medium"
                  sx={{ mt: 1 }}
                />
              </FormControl>

              <FormControl sx={{ width: 200 }}>
                <FormLabel required>Ordem</FormLabel>
                <TextField
                  select
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value)}
                  SelectProps={{
                    native: false,
                    IconComponent: () => null, // remover seta padrão se quiser custom
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  sx={{ mt: 1 }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </TextField>
              </FormControl>
            </Box>

            {/* Observações (Textarea com toolbar) */}
            <FormControl fullWidth>
              <FormLabel>Observações</FormLabel>
              <Box sx={{ mt: 1, border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Toolbar */}
                <Box
                  sx={{
                    bgcolor: '#f9fafb',
                    p: 1,
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: 1,
                  }}
                >
                  <IconButton size="small"><BoldIcon fontSize="small" /></IconButton>
                  <IconButton size="small"><ItalicIcon fontSize="small" /></IconButton>
                  <IconButton size="small"><UnderlineIcon fontSize="small" /></IconButton>
                  <Divider orientation="vertical" flexItem />
                  <IconButton size="small"><BulletListIcon fontSize="small" /></IconButton>
                  <IconButton size="small"><NumberedListIcon fontSize="small" /></IconButton>
                </Box>

                {/* Área de texto */}
                <TextField
                  multiline
                  rows={8}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  variant="standard"
                  fullWidth
                  InputProps={{
                    disableUnderline: true,
                    sx: { p: 2, fontSize: 16 },
                  }}
                  placeholder="Digite as observações aqui..."
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Suporte a formatação simples e quebras de linha
              </Typography>
            </FormControl>

            {/* Status */}
            <FormControl>
              <FormLabel>Status</FormLabel>
              <RadioGroup
                row
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
                sx={{ mt: 1, gap: 4 }}
              >
                <FormControlLabel
                  value="ativo"
                  control={<Radio color="success" />}
                  label="Ativo"
                />
                <FormControlLabel
                  value="inativo"
                  control={<Radio />}
                  label="Inativo"
                />
              </RadioGroup>
            </FormControl>
          </Box>

          {/* Ações fixas no rodapé */}
          <Box
            sx={{
              mt: 6,
              pt: 3,
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleExcluir}
            >
              Excluir
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleVoltar}
              >
                Cancelar
              </Button>

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSalvar}
                sx={{ bgcolor: '#ffbe33', '&:hover': { bgcolor: '#f5a623' } }}
              >
                Salvar Bloco
              </Button>
            </Box>
          </Box>

          {/* Mensagem de validação */}
          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}

          {!error && titulo && ordem && (
            <Alert
              severity="success"
              icon={<CheckCircleIcon />}
              sx={{ mt: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              Todos os campos obrigatórios foram preenchidos
            </Alert>
          )}
        </Box>
      </Paper>
    </Box>
  );
}