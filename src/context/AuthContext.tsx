import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Organization, User } from '@/types';
import { authApi, orgStore, tokenStore, userStore } from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  org: Organization | null;
  setOrg: (o: Organization | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => userStore.get());
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const [org, setOrgState] = useState<Organization | null>(() => orgStore.get());

  useEffect(() => {
    if (token) tokenStore.set(token);
    else tokenStore.clear();
  }, [token]);

  useEffect(() => {
    if (user) userStore.set(user);
    else userStore.clear();
  }, [user]);

  const setOrg = useCallback((o: Organization | null) => {
    setOrgState(o);
    if (o) orgStore.set(o);
    else orgStore.clear();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setToken(res.data.token);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — token may already be invalid
    }
    setToken(null);
    setUser(null);
    setOrg(null);
  }, [setOrg]);

  const refreshUser = useCallback((u: User) => setUser(u), []);

  return (
    <AuthContext.Provider
      value={{ user, token, org, setOrg, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
