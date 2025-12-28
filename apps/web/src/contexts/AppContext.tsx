import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, Organization, UserRole, AppState } from '@/types';
import { currentUser, mockOrganizations } from '@/data/mockData';

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
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

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock validation
    if (email && password.length >= 6) {
      setUser(currentUser);
      setOrganizations(mockOrganizations);
      setCurrentOrg(mockOrganizations[0]);
      setUserRole('ADMIN'); // Default to admin for demo
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
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
