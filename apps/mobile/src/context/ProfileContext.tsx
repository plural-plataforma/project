// ProfileContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext'; // ← importante
import { buscarProfessor } from '@src/services/professorService';
import { isCadastroCompleto } from '@src/utils/professorUtils';

interface ProfileContextType {
  cadastroCompleto: boolean;
  loadingProfile: boolean;
  refreshCadastroCompleto: () => Promise<void>;
  resetProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const STORAGE_KEY = 'cadastroCompleto';

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn, userToken } = useAuth();
  const [cadastroCompleto, setCadastroCompletoState] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const refreshCadastroCompleto = async () => {
    if (!isLoggedIn || !userToken) {
      setCadastroCompletoState(false);
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    try {
      const data = await buscarProfessor();
      const professor = data.objeto;
      const completo = isCadastroCompleto(professor);
      
      setCadastroCompletoState(completo);
      await AsyncStorage.setItem(STORAGE_KEY, completo.toString());
    } catch (err) {
      console.warn('Não foi possível verificar cadastro completo', err);
      // mantém o valor anterior ou false
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setCadastroCompletoState(false);
      setLoadingProfile(false);
      return;
    }

    // Carrega valor em cache primeiro (rápido)
    AsyncStorage.getItem(STORAGE_KEY).then(value => {
      if (value !== null) {
        setCadastroCompletoState(value === 'true');
      }
    });

    // Depois valida com servidor
    refreshCadastroCompleto();
  }, [isLoggedIn]);

  const resetProfile = async () => {
    setCadastroCompletoState(false);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ProfileContext.Provider
      value={{
        cadastroCompleto,
        loadingProfile,
        refreshCadastroCompleto,
        resetProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile deve ser usado dentro de ProfileProvider');
  return context;
};