import { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown, Copy, Check } from '@phosphor-icons/react';

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
  Drawer,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  InputAdornment,
} from '@mui/material';

import { updateUserProfile } from '../../services/userProfileService'; // ajuste o caminho conforme sua estrutura
import { resetarSenhaAdmin } from '../../services/adminService';
import { Usuario } from '../../types/userTypes';
import { jwtDecode } from 'jwt-decode';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  initialData?: Partial<Usuario>;
  onSuccess?: () => void;  // ← adicionado aqui (opcional)
  onProximo?: () => void;
  onAnterior?: () => void;
  temProximo?: boolean;
  temAnterior?: boolean;
}

export default function ProfileUserAppEdit({
  open,
  onClose,
  userId,
  initialData,
  onSuccess,
  onProximo,
  onAnterior,
  temProximo = false,
  temAnterior = false,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<Partial<Usuario>>(initialData || {});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetando, setResetando] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [novaSenhaGerada, setNovaSenhaGerada] = useState<string | null>(null);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [senhaCopiada, setSenhaCopiada] = useState(false);

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
    setError(null);
    setSuccess(false);

    // Evita vazar a senha temporária de um usuário pro modal do próximo
    setNovaSenhaGerada(null);
    setEmailEnviado(false);
    setResetError(null);
    setConfirmResetOpen(false);
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

  const handleResetarSenha = async () => {
    if (!formData.idUsuario) return;

    setResetando(true);
    setResetError(null);

    try {
      const resultado = await resetarSenhaAdmin(formData.idUsuario);
      setNovaSenhaGerada(resultado.novaSenha);
      setEmailEnviado(resultado.emailEnviado);
      setConfirmResetOpen(false);
    } catch (err: any) {
      setResetError(err.message || 'Erro ao resetar senha.');
    } finally {
      setResetando(false);
    }
  };

  const handleCopiarSenha = async () => {
    if (!novaSenhaGerada) return;
    try {
      await navigator.clipboard.writeText(novaSenhaGerada);
      setSenhaCopiada(true);
      setTimeout(() => setSenhaCopiada(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar senha:', err);
    }
  };

  const handleFecharResultadoReset = () => {
    setNovaSenhaGerada(null);
    setEmailEnviado(false);
    setSenhaCopiada(false);
  };

  if (!open) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 480 },
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box
        sx={{
          bgcolor: '#276678',
          color: 'white',
          py: 2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Editar Perfil
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Usuário anterior">
            <span>
              <IconButton
                size="small"
                onClick={onAnterior}
                disabled={!temAnterior}
                sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
              >
                <ArrowUp size={18} weight="bold" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Próximo usuário">
            <span>
              <IconButton
                size="small"
                onClick={onProximo}
                disabled={!temProximo}
                sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
              >
                <ArrowDown size={18} weight="bold" />
              </IconButton>
            </span>
          </Tooltip>
          <IconButton size="small" onClick={onClose} sx={{ color: 'white', ml: 1 }}>
            <X size={20} weight="bold" />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
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
            <Grid size={{ xs: 12 }}>
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
            <Grid size={{ xs: 12 }}>
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
            <Grid size={{ xs: 12 }}>
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
            <Grid size={{ xs: 12 }}>
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
            <Grid size={{ xs: 12 }}>
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
            <Grid size={{ xs: 12 }}>
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
            <Grid size={{ xs: 12 }}>
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
      </Box>

      <Box
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        {isAdmin ? (
          <Button
            onClick={() => setConfirmResetOpen(true)}
            disabled={saving || !formData.idUsuario}
            color="warning"
            variant="outlined"
          >
            Resetar senha
          </Button>
        ) : (
          <span />
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
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
        </Box>
      </Box>

      {/* Confirmação de reset de senha */}
      <Dialog open={confirmResetOpen} onClose={() => setConfirmResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Resetar senha da usuária?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Uma nova senha aleatória será gerada para <b>{formData.nomeCompleto || 'esta usuária'}</b> e
            enviada por e-mail. A senha atual deixará de funcionar imediatamente.
          </DialogContentText>
          {resetError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {resetError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmResetOpen(false)} disabled={resetando}>
            Cancelar
          </Button>
          <Button
            onClick={handleResetarSenha}
            disabled={resetando}
            color="warning"
            variant="contained"
          >
            {resetando ? <CircularProgress size={20} color="inherit" /> : 'Resetar senha'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resultado do reset — senha temporária pra copiar */}
      <Dialog open={!!novaSenhaGerada} onClose={handleFecharResultadoReset} maxWidth="xs" fullWidth>
        <DialogTitle>Senha resetada com sucesso</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {emailEnviado
              ? 'A nova senha também foi enviada por e-mail para a usuária.'
              : 'Não foi possível enviar o e-mail automaticamente — repasse a senha manualmente.'}
          </DialogContentText>
          <TextField
            label="Senha temporária"
            fullWidth
            value={novaSenhaGerada || ''}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={senhaCopiada ? 'Copiado!' : 'Copiar senha'}>
                    <IconButton onClick={handleCopiarSenha} edge="end">
                      {senhaCopiada ? <Check size={20} color="#16A34A" /> : <Copy size={20} />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFecharResultadoReset} sx={{ color: '#276678' }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}