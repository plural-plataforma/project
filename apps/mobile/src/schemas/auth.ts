import { z } from 'zod';

export const changePasswordSchema = z
  .object({
    senhaAtual: z
      .string()
      .min(1, 'Senha atual é obrigatória')
      .min(6, 'Senha atual deve ter pelo menos 6 caracteres'),
    novaSenha: z
      .string()
      .min(1, 'Nova senha é obrigatória')
      .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'Nova senha deve conter pelo menos uma letra maiúscula (A-Z)'), // Previne "PasswordRequiresUpper"
    confirmarNovaSenha: z.string().min(1, 'Confirmação é obrigatória'),
  })
  .refine((data) => data.novaSenha === data.confirmarNovaSenha, {
    message: 'A senha não coincidem',
    path: ['confirmarNovaSenha'], // Erro no campo de confirmação
  })
  .refine((data) => data.senhaAtual !== data.novaSenha, {
    message: 'A nova senha deve ser diferente da atual',
    path: ['confirmarNovaSenha'], // Erro no campo de confirmação
  });

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;