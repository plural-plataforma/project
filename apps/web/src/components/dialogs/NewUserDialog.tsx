import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Box,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { registerUser } from '../../api/authService';

interface NewUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (email: string, name: string) => void;
  onError?: (message: string) => void;
}

export default function NewUserDialog({
  open,
  onClose,
  onSuccess,
  onError,
}: NewUserDialogProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('Plural@2025');
  const [showPassword, setShowPassword] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setNome('');
    setEmail('');
    setSenha('Plural@2025');
    setExpirationDate('');
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): string | null => {
    if (!nome.trim()) return 'Nome completo é obrigatório';
    if (!email.trim()) return 'E-mail é obrigatório';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'E-mail inválido';

    if (senha.length < 8) return 'A senha deve ter pelo menos 8 caracteres';

    // Validação simples de formato ISO para expirationDate (opcional)
    if (expirationDate && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/.test(expirationDate)) {
      return 'Formato de data inválido. Use o formato do campo.';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await registerUser({
        email: email.trim(),
        senha: senha.trim(),
        nomeCompleto: nome.trim(),
        aceitouTermos: true,
        deveAlterarSenha: true,
        ...(expirationDate && { expirationDate }),
      });

      onSuccess?.(email.trim(), nome.trim());
      handleClose();
    } catch (err: any) {
      const msg = err.message || 'Erro ao cadastrar novo usuário. Tente novamente.';
      setFormError(msg);
      onError?.(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#276678', color: 'white', py: 2 }}>
        Cadastrar Novo Usuário
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3} paddingTop={2}>
          <TextField
            label="Nome Completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            fullWidth
            required
            autoFocus
            variant="outlined"
            disabled={submitting}
          />

          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            variant="outlined"
            disabled={submitting}
          />

          <TextField
            label="Senha inicial"
            type={showPassword ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            fullWidth
            required
            variant="outlined"
            disabled={submitting}
            helperText="O usuário deverá alterar esta senha no primeiro login"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    disabled={submitting}
                  >
                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Data de expiração da conta (opcional)
            </Typography>
            <TextField
              type="datetime-local"
              value={expirationDate ? expirationDate.slice(0, 16) : ''}
              onChange={(e) => {
                const val = e.target.value;
                setExpirationDate(val ? `${val}:00.000Z` : '');
              }}
              fullWidth
              variant="outlined"
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Deixe em branco para acesso permanente
            </Typography>
          </Box>

          {formError && (
            <Typography color="error" variant="body2">
              {formError}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={submitting} sx={{ color: '#276678' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ bgcolor: '#276678', '&:hover': { bgcolor: '#1e4d5a' } }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Cadastrar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}