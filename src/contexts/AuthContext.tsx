import { createContext, useContext } from 'react';
import type { Me } from '../api/auth';

interface AuthContextType {
  me: Me | null;
  setMe: (me: Me | null) => void;
  loadingMe: boolean;
  isGuest: boolean; // 게스트 상태 확인용 추가
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}