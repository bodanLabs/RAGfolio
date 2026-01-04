import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, Organization, UserRole, AppState } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const ACCESS_TOKEN_KEY = 'ragfolio_access_token';

type TokenResponse = {
  access_token: string;
  token_type: 'bearer';
  ok: boolean;
};

type ApiUser = {
  id: number;
  email: string;
  name?: string | null;
  created_at: string;
};

const mapUser = (apiUser: ApiUser): User => {
  const emailFallback = apiUser.email.split('@')[0] || 'User';
  const displayName = apiUser.name?.trim() || emailFallback;

  return {
    id: String(apiUser.id),
    name: displayName,
    email: apiUser.email,
    avatarUrl: undefined,
  };
};

const parseErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    if (Array.isArray(data?.detail)) {
      return data.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(', ') || 'Request failed';
    }
    if (typeof data?.message === 'string') {
      return data.message;
    }
  } catch {
    return response.statusText || 'Request failed';
  }
  return response.statusText || 'Request failed';
};

const requestJson = async <T,>(path: string, options: RequestInit = {}, token?: string): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
};

const isApiError = (error: unknown): error is Error & { status?: number } => {
  return typeof error === 'object' && error !== null && 'status' in error;
};

const getStoredToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

const setStoredToken = (token: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

const clearStoredToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setCurrentOrganization: (org: Organization) => void;
  createOrganization: (name: string) => Promise<Organization>;
  isAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [currentOrganization, setCurrentOrg] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      return;
    }

    let isActive = true;

    const loadUser = async () => {
      try {
        const apiUser = await requestJson<ApiUser>('/auth/me', { method: 'GET' }, token);
        if (!isActive) {
          return;
        }
        setUser(mapUser(apiUser));
        setIsAuthenticated(true);
        setUserRole('USER');
      } catch {
        if (isActive) {
          clearStoredToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    void loadUser();

    return () => {
      isActive = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const tokenResponse = await requestJson<TokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(tokenResponse.access_token);

      const apiUser = await requestJson<ApiUser>('/auth/me', { method: 'GET' }, tokenResponse.access_token);
      setUser(mapUser(apiUser));
      setOrganizations([]);
      setCurrentOrg(null);
      setUserRole('USER');
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      clearStoredToken();
      setUser(null);
      setIsAuthenticated(false);
      if (isApiError(error) && error.status === 401) {
        return false;
      }
      throw error;
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string): Promise<void> => {
    try {
      const tokenResponse = await requestJson<TokenResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      setStoredToken(tokenResponse.access_token);

      const apiUser = await requestJson<ApiUser>('/auth/me', { method: 'GET' }, tokenResponse.access_token);
      setUser(mapUser(apiUser));
      setOrganizations([]);
      setCurrentOrg(null);
      setUserRole('USER');
      setIsAuthenticated(true);
    } catch (error) {
      clearStoredToken();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setCurrentOrg(null);
    setUserRole(null);
    setOrganizations([]);
    setIsAuthenticated(false);
  }, []);

  const setCurrentOrganization = useCallback((org: Organization) => {
    setCurrentOrg(org);
    // In real app, would also fetch user's role for this org
  }, []);

  const createOrganization = useCallback(async (name: string): Promise<Organization> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name,
      createdDate: new Date().toISOString(),
      stats: {
        fileCount: 0,
        totalChunks: 0,
        totalSize: 0,
      },
    };
    
    setOrganizations(prev => [...prev, newOrg]);
    setCurrentOrg(newOrg);
    setUserRole('ADMIN');
    return newOrg;
  }, []);

  const isAdmin = userRole === 'ADMIN';

  return (
    <AppContext.Provider
      value={{
        user,
        currentOrganization,
        userRole,
        isAuthenticated,
        organizations,
        login,
        signup,
        logout,
        setCurrentOrganization,
        createOrganization,
        isAdmin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
