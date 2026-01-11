/**
 * App Context
 * Provides global app state including authentication and organization context.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { organizationsApi } from '@/api/organizations';
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  isApiError,
} from '@/lib/api-client';
import { mapUser, mapOrganization } from '@/lib/mappers';
import { queryKeys } from '@/lib/query-keys';
import type { User, Organization, UserRole, AppState } from '@/types';

type AppContextType = AppState & {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setCurrentOrganization: (org: Organization) => void;
  createOrganization: (name: string) => Promise<Organization>;
  refreshOrganizations: () => Promise<void>;
  isAdmin: boolean;
  isLoading: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [currentOrganization, setCurrentOrg] = useState<Organization | null>(
    null
  );
  const [currentOrganizationId, setCurrentOrganizationId] = useState<
    number | null
  >(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's role in current organization
  const fetchUserRole = useCallback(async (orgId: number, userId: number) => {
    try {
      const members = await organizationsApi.listMembers(orgId, 1, 100);
      const member = members.find((m) => m.user_id === userId);
      setUserRole(member?.role ?? 'USER');
    } catch {
      setUserRole('USER');
    }
  }, []);

  // Fetch organizations for current user
  const fetchOrganizations = useCallback(async () => {
    try {
      const orgs = await organizationsApi.list(1, 100);
      const mappedOrgs = orgs.map(mapOrganization);
      setOrganizations(mappedOrgs);
      return mappedOrgs;
    } catch {
      setOrganizations([]);
      return [];
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const loadUser = async () => {
      try {
        const apiUser = await authApi.me();
        if (!isActive) return;

        const mappedUser = mapUser(apiUser);
        setUser(mappedUser);
        setIsAuthenticated(true);

        // Fetch organizations
        const orgs = await fetchOrganizations();

        // Auto-select first org if available
        if (orgs.length > 0 && isActive) {
          const firstOrg = orgs[0];
          setCurrentOrg(firstOrg);
          setCurrentOrganizationId(Number(firstOrg.id));
          await fetchUserRole(Number(firstOrg.id), apiUser.id);
        }
      } catch {
        if (isActive) {
          clearStoredToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      isActive = false;
    };
  }, [fetchOrganizations, fetchUserRole]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const tokenResponse = await authApi.login({ email, password });
        setStoredToken(tokenResponse.access_token);

        const apiUser = await authApi.me();
        const mappedUser = mapUser(apiUser);
        setUser(mappedUser);
        setIsAuthenticated(true);

        // Fetch organizations
        const orgs = await fetchOrganizations();

        // Auto-select first org if available
        if (orgs.length > 0) {
          const firstOrg = orgs[0];
          setCurrentOrg(firstOrg);
          setCurrentOrganizationId(Number(firstOrg.id));
          await fetchUserRole(Number(firstOrg.id), apiUser.id);
        } else {
          setCurrentOrg(null);
          setCurrentOrganizationId(null);
          setUserRole(null);
        }

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
    },
    [fetchOrganizations, fetchUserRole]
  );

  const signup = useCallback(
    async (email: string, password: string, name?: string): Promise<void> => {
      try {
        const tokenResponse = await authApi.signup({ email, password, name });
        setStoredToken(tokenResponse.access_token);

        const apiUser = await authApi.me();
        const mappedUser = mapUser(apiUser);
        setUser(mappedUser);
        setOrganizations([]);
        setCurrentOrg(null);
        setCurrentOrganizationId(null);
        setUserRole(null);
        setIsAuthenticated(true);
      } catch (error) {
        clearStoredToken();
        setUser(null);
        setIsAuthenticated(false);
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setCurrentOrg(null);
    setCurrentOrganizationId(null);
    setUserRole(null);
    setOrganizations([]);
    setIsAuthenticated(false);
    // Clear all queries on logout
    queryClient.clear();
  }, [queryClient]);

  const setCurrentOrganization = useCallback(
    (org: Organization) => {
      setCurrentOrg(org);
      setCurrentOrganizationId(Number(org.id));
      // Fetch user's role in new org
      if (user) {
        void fetchUserRole(Number(org.id), Number(user.id));
      }
      // Invalidate org-specific queries when switching orgs
      void queryClient.invalidateQueries({
        queryKey: ['organizations', Number(org.id)],
      });
    },
    [user, fetchUserRole, queryClient]
  );

  const createOrganization = useCallback(
    async (name: string): Promise<Organization> => {
      const apiOrg = await organizationsApi.create({ name });
      const newOrg = mapOrganization(apiOrg);

      setOrganizations((prev) => [...prev, newOrg]);
      setCurrentOrg(newOrg);
      setCurrentOrganizationId(Number(newOrg.id));
      setUserRole('ADMIN'); // Creator is always admin

      // Invalidate organizations list
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.lists(),
      });

      return newOrg;
    },
    [queryClient]
  );

  const refreshOrganizations = useCallback(async () => {
    await fetchOrganizations();
  }, [fetchOrganizations]);

  const isAdmin = userRole === 'ADMIN';

  const value = useMemo<AppContextType>(
    () => ({
      user,
      currentOrganization,
      currentOrganizationId,
      userRole,
      isAuthenticated,
      organizations,
      login,
      signup,
      logout,
      setCurrentOrganization,
      createOrganization,
      refreshOrganizations,
      isAdmin,
      isLoading,
    }),
    [
      user,
      currentOrganization,
      currentOrganizationId,
      userRole,
      isAuthenticated,
      organizations,
      login,
      signup,
      logout,
      setCurrentOrganization,
      createOrganization,
      refreshOrganizations,
      isAdmin,
      isLoading,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
