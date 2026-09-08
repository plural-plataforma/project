// Wrapper tipado para a Credential Management API do navegador.
// Suporte parcial (Chrome/Edge); Safari e Firefox ignoram graciosamente via feature-detect.

interface PasswordCredentialInit {
  id: string;
  password: string;
  name?: string;
}

interface PasswordCredential extends Credential {
  readonly password: string;
}

interface PasswordCredentialRequestOptions extends CredentialRequestOptions {
  password?: boolean;
}

declare global {
  interface Window {
    PasswordCredential?: {
      new (data: PasswordCredentialInit): PasswordCredential;
    };
  }
}

const isSupported = () =>
  typeof window !== 'undefined' && !!window.PasswordCredential && !!navigator.credentials;

/**
 * Busca credencial salva pelo gerenciador de senhas do navegador,
 * permitindo preencher (ou logar mais rápido em) visitas seguintes.
 */
export async function getSavedCredential(): Promise<{ id: string; password: string } | null> {
  if (!isSupported()) return null;

  try {
    const options: PasswordCredentialRequestOptions = { password: true, mediation: 'optional' };
    const credential = await navigator.credentials.get(options);
    if (!credential || credential.type !== 'password') return null;

    const { id, password } = credential as PasswordCredential;
    return { id, password };
  } catch {
    return null;
  }
}

/** Dispara o prompt nativo do navegador para salvar/atualizar a senha após login bem-sucedido. */
export async function storeSavedCredential(id: string, password: string, name?: string): Promise<void> {
  if (!isSupported()) return;

  try {
    const credential = new window.PasswordCredential!({ id, password, name });
    await navigator.credentials.store(credential);
  } catch {
    // navegador pode recusar (sem gesto do usuário, contexto não seguro, etc.) — falha silenciosa
  }
}
