import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef
} from 'react';
import { getToken, signOut as authSignOut } from '../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, usePathname } from 'expo-router';

interface AuthContextType {
  isLoggedIn: boolean;
  loading: boolean;
  userToken: string | null;
  precisaTrocarSenha: boolean;
  login: (token: string, precisaTrocarSenha: boolean) => void;
  trocarSenhaConcluida: () => void;
  signOut: () => Promise<void>;
  logoutLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [precisaTrocarSenha, setPrecisaTrocarSenha] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const isSigningOut = useRef(false); // Prevent recursive signOut calls
  const isRedirecting = useRef(false); // Evita loops de redirecionamento
  const pathname = usePathname(); // Get current pathname

  // useEffect para checkAuth: roda apenas no mount inicial
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        const precisaSenhaStr = await AsyncStorage.getItem('precisaTrocarSenha');
        const precisaTrocar = precisaSenhaStr === 'true';

        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            if (payload.exp < currentTime) {
              await authSignOut();
              await AsyncStorage.removeItem('precisaTrocarSenha'); // Limpa flag sempre
              setUserToken(null);
              setIsLoggedIn(false);
              setPrecisaTrocarSenha(false);
            } else {
              setUserToken(token);
              setIsLoggedIn(true);
              setPrecisaTrocarSenha(precisaTrocar);
            }
          } catch (e) {
            console.error('❌ Erro ao decodificar token:', e);
            await authSignOut();
            await AsyncStorage.removeItem('precisaTrocarSenha'); // Limpa em erro
            setUserToken(null);
            setIsLoggedIn(false);
            setPrecisaTrocarSenha(false);
          }
        } else {
          setIsLoggedIn(false);
          setPrecisaTrocarSenha(false);
          await AsyncStorage.removeItem('precisaTrocarSenha'); // Limpa se sem token
        }
      } catch (error) {
        console.error('❌ Erro ao verificar auth:', error);
        setIsLoggedIn(false);
        setPrecisaTrocarSenha(false);
        await AsyncStorage.removeItem('precisaTrocarSenha'); // Limpa em erro geral
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // Dependência vazia: roda só no mount

  // useEffect para redirecionamentos (com debounce para evitar loops)
  useEffect(() => {
    if (loading || isRedirecting.current) {
      return; // Evita durante loading ou redirect em progresso
    }

    if (isLoggedIn) {
      // Se precisa trocar senha e não está na tela de troca, redireciona para lá
      if (precisaTrocarSenha && pathname !== '/auth/changePassword') {
        isRedirecting.current = true;
        router.replace('/auth/changePassword');
        setTimeout(() => { isRedirecting.current = false; }, 500); // Debounce: libera após 500ms
        return;
      }

      // Se NÃO precisa trocar e está na tela de troca, redireciona para dashboard (forçado)
      if (!precisaTrocarSenha && pathname === '/auth/changePassword') {
        isRedirecting.current = true;
        router.replace('/dashboard');
        setTimeout(() => { isRedirecting.current = false; }, 500);
        return;
      }

      // Redireciona para dashboard se na tela de login
      if (pathname === '/' || pathname === '/auth/login') {
        isRedirecting.current = true;
        router.replace('/dashboard');
        setTimeout(() => { isRedirecting.current = false; }, 500);
        return;
      }
    } else if (!isLoggedIn && pathname === '/dashboard') {
      // Redireciona para login se não logado e na dashboard
      isRedirecting.current = true;
      router.replace('/');
      setTimeout(() => { isRedirecting.current = false; }, 500);
      return;
    }
  }, [isLoggedIn, precisaTrocarSenha, loading]); // Removida 'pathname' para evitar re-triggers desnecessários; usePathname é watched internamente

  const login = (token: string, precisaTrocar: boolean) => {
    if (!token) {
      console.warn('⚠️ Token vazio no context.login — login falhará!');
      return;
    }
    setUserToken(token);
    setIsLoggedIn(true);
    setPrecisaTrocarSenha(precisaTrocar);

    // Salva a flag no storage para persistência
    AsyncStorage.setItem('precisaTrocarSenha', precisaTrocar.toString());

    // Re-valida token imediatamente após login para checar expiração
    setTimeout(() => {
      const validateToken = async () => {
        try {
          const savedToken = await getToken();
          if (savedToken) {
            const payload = JSON.parse(atob(savedToken.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            if (payload.exp < currentTime) {
              await authSignOut();
              await AsyncStorage.removeItem('precisaTrocarSenha');
              setUserToken(null);
              setIsLoggedIn(false);
              setPrecisaTrocarSenha(false);
            }
          }
        } catch (e) {
          console.error('❌ Erro validando token pós-login:', e);
          await authSignOut();
          await AsyncStorage.removeItem('precisaTrocarSenha');
          setUserToken(null);
          setIsLoggedIn(false);
          setPrecisaTrocarSenha(false);
        }
      };
      validateToken();
    }, 100); // Delay pequeno para async setState
  };

  // Método para marcar que a troca de senha foi concluída (com await para sync)
  const trocarSenhaConcluida = async () => {
    setPrecisaTrocarSenha(false);
    await AsyncStorage.removeItem('precisaTrocarSenha'); 

  };

  const signOut = async (): Promise<void> => {
    if (isSigningOut.current) {
      return;
    }
    isSigningOut.current = true;
    setLogoutLoading(true);
    try {
      await authSignOut();
      setUserToken(null);
      setIsLoggedIn(false);
      setPrecisaTrocarSenha(false);
      await AsyncStorage.removeItem('precisaTrocarSenha'); // Limpa flag
      if (pathname !== '/') {
        router.replace('/');
      }
    } catch (error) {
      setUserToken(null);
      setIsLoggedIn(false);
      setPrecisaTrocarSenha(false);
      await AsyncStorage.removeItem('precisaTrocarSenha');
      if (pathname !== '/') {
        router.replace('/');
      }
    } finally {
      setLogoutLoading(false);
      isSigningOut.current = false;
    }
  };

  const value = {
    isLoggedIn,
    loading,
    userToken,
    precisaTrocarSenha,
    login,
    trocarSenhaConcluida,
    signOut,
    logoutLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};