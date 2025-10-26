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
              setUserToken(null);
              setIsLoggedIn(false);
              setPrecisaTrocarSenha(false);
              await AsyncStorage.removeItem('precisaTrocarSenha');
            } else {
              setUserToken(token);
              setIsLoggedIn(true);
              setPrecisaTrocarSenha(precisaTrocar);
            }
          } catch (e) {
            console.error('❌ Erro ao decodificar token:', e);
            await authSignOut();
            setUserToken(null);
            setIsLoggedIn(false);
            setPrecisaTrocarSenha(false);
            await AsyncStorage.removeItem('precisaTrocarSenha');
          }
        } else {
          setIsLoggedIn(false);
          setPrecisaTrocarSenha(false);
          await AsyncStorage.removeItem('precisaTrocarSenha');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar auth:', error);
        setIsLoggedIn(false);
        setPrecisaTrocarSenha(false);
        await AsyncStorage.removeItem('precisaTrocarSenha');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // Dependência vazia: roda só no mount

  // useEffect separado para redirecionamentos baseados em isLoggedIn, precisaTrocarSenha e pathname
  useEffect(() => {
    if (loading) return; // Evita redirecionamentos durante loading inicial

    if (isLoggedIn) {
      // Se precisa trocar senha e não está na tela de troca, redireciona para lá
      if (precisaTrocarSenha && pathname !== '/auth/changePassword') {
        router.replace('/auth/changePassword');
        return;
      }
      // Redireciona para dashboard se na tela de login
      if (pathname === '/' || pathname === '/auth/login') {
        router.replace('/dashboard');
      }
    } else if (!isLoggedIn && pathname === '/dashboard') {
      // Redireciona para login se não logado e na dashboard
      router.replace('/');
    }
  }, [isLoggedIn, precisaTrocarSenha, loading, pathname]);

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
              setUserToken(null);
              setIsLoggedIn(false);
              setPrecisaTrocarSenha(false);
              await AsyncStorage.removeItem('precisaTrocarSenha');
            }
          }
        } catch (e) {
          console.error('❌ Erro validando token pós-login:', e);
        }
      };
      validateToken();
    }, 100); // Delay pequeno para async setState
  };

  // Método para marcar que a troca de senha foi concluída
  const trocarSenhaConcluida = () => {
    setPrecisaTrocarSenha(false);
    AsyncStorage.removeItem('precisaTrocarSenha');
    // Opcional: Redireciona para dashboard
    if (pathname === '/auth/changePassword') {
      router.replace('/dashboard');
    }
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
      await AsyncStorage.removeItem('precisaTrocarSenha');
      if (pathname !== '/') {
        router.replace('/');
      }
    } catch (error) {
      console.error('❌ Erro no signOut:', error);
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