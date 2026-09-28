import { AuthUser } from '@clinica/shared';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  API_URL,
  clearTokens,
  getStoredUser,
  setTokens,
  storeUser,
} from '@/lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  unitId: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUnitId: (id: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [unitId, setUnitId] = useState<string | null>(() => {
    const u = getStoredUser();
    return u?.units[0]?.id ?? null;
  });

  const value = useMemo(
    () => ({
      user,
      unitId,
      setUnitId,
      async login(username: string, password: string) {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Credenciales inválidas' }));
          throw new Error(err.message ?? 'Credenciales inválidas');
        }
        const data = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
          user: AuthUser;
        };
        setTokens(data.accessToken, data.refreshToken);
        storeUser(data.user);
        setUser(data.user);
        setUnitId(data.user.units[0]?.id ?? null);
      },
      logout() {
        clearTokens();
        setUser(null);
        setUnitId(null);
      },
    }),
    [user, unitId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
