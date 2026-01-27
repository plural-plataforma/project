import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, signOut as authSignOut } from '../services/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  loading: boolean;
  userToken: string | null;
  precisaTrocarSenha: boolean;
  login: (token: string, precisaTrocarSenha: boolean) => Promise<void>;
  trocarSenhaConcluida: () => Promise<void>;
  signOut: () => Promise<void>;
  logoutLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [precisaTrocarSenha, setPrecisaTrocarSenha] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const isSigningOut = useRef(false);

  /**
   * 🔁 CheckAuth inicial
   * Apenas valida token e carrega estado persistido
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        const precisaTrocarStr = await AsyncStorage.getItem('precisaTrocarSenha');

        if (!token) {
          await limparSessao();
          return;
        }

        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const now = Math.floor(Date.now() / 1000);

          if (payload.exp < now) {
            await limparSessao();
            return;
          }

          setUserToken(token);
          setIsLoggedIn(true);
          setPrecisaTrocarSenha(precisaTrocarStr === 'true');

        } catch (e) {
          console.error('❌ Token inválido:', e);
          await limparSessao();
        }

      } catch (e) {
        console.error('❌ Erro no checkAuth:', e);
        await limparSessao();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * 🔑 Login
   * Token + flag SEM redirecionamento
   */
  const login = async (token: string, precisaTrocar: boolean) => {
    setUserToken(token);
    setIsLoggedIn(true);
    setPrecisaTrocarSenha(precisaTrocar);

    await AsyncStorage.setItem('precisaTrocarSenha', precisaTrocar.toString());
  };

  /**
   * 🔐 Senha alterada com sucesso
   */
  const trocarSenhaConcluida = async () => {
    setPrecisaTrocarSenha(false);
    await AsyncStorage.removeItem('precisaTrocarSenha');
  };

  /**
   * 🚪 Logout
   */
  const signOut = async () => {
    if (isSigningOut.current) return;

    isSigningOut.current = true;
    setLogoutLoading(true);

    try {
      await authSignOut();
    } catch (e) {
      console.warn('⚠️ Erro ao deslogar:', e);
    } finally {
      await limparSessao();
      setLogoutLoading(false);
      isSigningOut.current = false;
    }
  };

  /**
   * 🧹 Limpa tudo
   */
  const limparSessao = async () => {
    setUserToken(null);
    setIsLoggedIn(false);
    setPrecisaTrocarSenha(false);
    await AsyncStorage.removeItem('precisaTrocarSenha');
    await AsyncStorage.removeItem('cadastroCompleto');
    await AsyncStorage.removeItem('alert_troca_senha_adiado');


  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        loading,
        userToken,
        precisaTrocarSenha,
        login,
        trocarSenhaConcluida,
        signOut,
        logoutLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
