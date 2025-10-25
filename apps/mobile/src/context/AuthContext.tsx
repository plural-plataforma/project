import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef
} from 'react';
import { getToken, signOut as authSignOut } from '../services/auth';
import { router, usePathname } from 'expo-router';

interface AuthContextType {
  isLoggedIn: boolean;
  loading: boolean;
  userToken: string | null;
  login: (token: string) => void;
  signOut: () => Promise<void>;
  logoutLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const isSigningOut = useRef(false); // Prevent recursive signOut calls
  const pathname = usePathname(); // Get current pathname

  // useEffect para checkAuth: roda apenas no mount inicial
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            if (payload.exp < currentTime) {
              await authSignOut();
              setUserToken(null);
              setIsLoggedIn(false);
            } else {
              setUserToken(token);
              setIsLoggedIn(true);
            }
          } catch (e) {
            console.error('❌ Erro ao decodificar token:', e);
            await authSignOut();
            setUserToken(null);
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar auth:', error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // Dependência vazia: roda só no mount

  // useEffect separado para redirecionamentos baseados em isLoggedIn e pathname
  useEffect(() => {
    if (loading) return; // Evita redirecionamentos durante loading inicial

    if (isLoggedIn && (pathname === '/' || pathname === '/')) {
      router.replace('/dashboard');
    } else if (!isLoggedIn && pathname === '/dashboard') {
      router.replace('/');
    }
  }, [isLoggedIn, loading, pathname]);

const login = (token: string) => {
  if (!token) {
    console.warn('⚠️ Token vazio no context.login — login falhará!');
    return;
  }
  setUserToken(token);
  setIsLoggedIn(true);
  
  // Re-valide token imediatamente após login para checar expiração
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
          }
        }
      } catch (e) {
        console.error('❌ Erro validando token pós-login:', e);
      }
    };
    validateToken();
  }, 100); // Delay pequeno para async setState
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
      if (pathname !== '/') {
        router.replace('/');
      }
    } catch (error) {
      console.error('❌ Erro no signOut:', error);
      setUserToken(null);
      setIsLoggedIn(false);
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
    login,
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