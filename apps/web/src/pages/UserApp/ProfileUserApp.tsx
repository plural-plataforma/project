import { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react';

import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

import { updateUserProfile } from '../../services/userProfileService'; // ajuste o caminho conforme sua estrutura
import { Usuario } from '../../types/userTypes';
import { jwtDecode } from 'jwt-decode';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  initialData?: Partial<Usuario>;
  onSuccess?: () => void;  // ← adicionado aqui (opcional)
}

export default function ProfileUserAppEdit({
  open,
  onClose,
  userId,
  initialData,
  onSuccess
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<Partial<Usuario>>(initialData || {});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (token) {
      try {
        const decoded: any = jwtDecode(token);

        // Chave correta do seu backend (ASP.NET Identity)
        const roleClaimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const role = decoded[roleClaimKey]; // "Admin" ou "Professor"

        const isAdminFromToken = role && role.toLowerCase() === 'admin';

        setIsAdmin(isAdminFromToken);

      } catch (err) {
        console.error('Erro ao decodificar token no modal de edição:', err);
      }
    }

    // Carrega initialData normalmente
    if (initialData && Object.keys(initialData).length > 0) {
      // Garante que expirationDate venha como string ISO ou null
      setFormData({
        ...initialData,
        expirationDate: initialData.expirationDate ?? null,
      });
      setLoading(false);
    }
  }, [initialData]);

  const handleSave = async () => {
    if (!formData.idUsuario) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    // Preparar roles delta (só se for admin e houver mudança)
    let rolesAdicionar: string[] = [];
    let rolesRemover: string[] = [];

    if (isAdmin) {
      const novoRole = formData.roles?.[0];
      const roleAtual = initialData?.roles?.[0] ?? initialData?.perfil;

      if (novoRole && novoRole !== roleAtual) {
        if (roleAtual) rolesRemover = [roleAtual];
        rolesAdicionar = [novoRole];
      }
    }

    const payload = {
      idUsuario: formData.idUsuario!,
      acao: formData.ativo ? 'A' : 'I',
      nome: (formData.nomeCompleto ?? '').trim() || undefined,
      email: (formData.email ?? '').trim() || undefined,
      telefone: String(formData.telefone ?? ''),
      isActive: !!formData.ativo,
      isEmbaixadora: !!formData.isEmbaixadora,
      expirationDate: formData.expirationDate
        ? new Date(formData.expirationDate).toISOString()
        : null,
      rolesAdicionar,
      rolesRemover,
    };

    // Se quiser forçar envio mesmo vazio (alguns backends exigem os campos)
    // payload.rolesAdicionar = rolesAdicionar;
    // payload.rolesRemover  = rolesRemover;

    try {
      await updateUserProfile(payload);

      if (onSuccess) await onSuccess();
      setSuccess(true);

      setTimeout(() => onClose(), 1800);
    } catch (err: any) {
      const msg = err.message || 'Erro ao salvar. Verifique os campos obrigatórios.';
      setError(msg);
      console.error('Payload enviado:', payload); // ← ajuda a debugar
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Usuario, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 4,
          boxShadow: 24,
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: '#276678', color: 'white', py: 2, px: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            Editar Perfil
          </Typography>
          <Button onClick={onClose} sx={{ color: 'white', minWidth: 'auto' }}>
            <X size={24} weight="bold" />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Perfil atualizado com sucesso!
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ paddingTop: 2 }}>
            {/* Nome completo */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Nome completo"
                fullWidth
                value={formData.nomeCompleto || ''}
                onChange={e => handleChange('nomeCompleto', e.target.value)}
                required
                variant="outlined"
              />
            </Grid>

            {/* E-mail */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="E-mail"
                fullWidth
                type="email"
                value={formData.email || ''}
                onChange={e => handleChange('email', e.target.value)}
                required
                variant="outlined"
              />
            </Grid>

            {/* Telefone */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Telefone / WhatsApp"
                fullWidth
                value={formData.telefone || ''}
                onChange={e => handleChange('telefone', e.target.value)}
                placeholder="(00) 00000-0000"
                variant="outlined"
              />
            </Grid>

            {/* Perfil (somente Admin pode editar) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              {isAdmin ? (
                <FormControl fullWidth required>
                  <InputLabel>Perfil</InputLabel>
                  <Select
                    value={formData.roles?.[0] || ''}
                    label="Perfil"
                    onChange={e => handleChange('roles', [e.target.value])}
                    variant="outlined"
                  >
                    <MenuItem value="Admin">Administrador</MenuItem>
                    <MenuItem value="Professor">Professor</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  label="Perfil Atual"
                  fullWidth
                  value={formData.perfil || 'Professor'}
                  disabled
                  variant="outlined"
                  helperText="Alterações de perfil são gerenciadas pela administração."
                />
              )}
            </Grid>

            {/* Status Ativo/Inativo */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status da Conta</InputLabel>
                <Select
                  value={formData.ativo !== undefined ? String(formData.ativo) : 'true'}
                  label="Status da Conta"
                  onChange={e => handleChange('ativo', e.target.value === 'true')}
                  variant="outlined"
                >
                  <MenuItem value="true">Ativo</MenuItem>
                  <MenuItem value="false">Inativo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Data de Expiração */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Data de Expiração"
                type="date"
                fullWidth
                value={
                  formData.expirationDate
                    ? new Date(formData.expirationDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const value = e.target.value;
                  // Converte '' → null e mantém formato ISO se quiser
                  handleChange('expirationDate', value ? new Date(value).toISOString() : null);
                }}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                helperText="Deixe em branco para nunca expirar"
              />
            </Grid>

            {/* Embaixadora */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!formData.isEmbaixadora}
                    onChange={(_, checked) => handleChange('isEmbaixadora', checked)}
                    color="primary"
                  />
                }
                label="Sou Embaixadora / Parceira"
                sx={{ mt: 1 }}
              />
            </Grid>


            {/* Aviso */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary">
                Alterações avançadas (ex: tipo de acesso, data de expiração, roles) são gerenciadas pelo time administrativo.
              </Typography>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: '#276678' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={
            saving ||
            !formData.nomeCompleto?.trim() ||
            !formData.email?.trim()
          }
          sx={{ bgcolor: '#276678', '&:hover': { bgcolor: '#1e4d5a' } }}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : 'Salvar Alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}