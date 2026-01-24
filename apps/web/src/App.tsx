import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { isApiError } from '@/lib/api-client';
import Index from './pages/Index';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Lazy load protected pages for better performance
const OrgSetupPage = lazy(() => import('./pages/OrgSetupPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const OrganizationPage = lazy(() => import('./pages/OrganizationPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Configure QueryClient with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute
      gcTime: 300_000, // 5 minutes (renamed from cacheTime in v5)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (isApiError(error) && error.status !== undefined) {
          if (error.status >= 400 && error.status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Loading fallback for lazy-loaded pages
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSkeleton variant="card" count={1} />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useApp();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, organizations, isLoading, currentOrganization } =
    useApp();

  // Show loading state while checking auth
  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/chat" replace /> : <LoginPage />
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? <Navigate to="/chat" replace /> : <SignupPage />
          }
        />
        <Route
          path="/org/setup"
          element={
            <ProtectedRoute>
              {organizations.length > 0 ? (
                <Navigate to="/chat" replace />
              ) : (
                <OrgSetupPage />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              {!currentOrganization && organizations.length === 0 ? (
                <Navigate to="/org/setup" replace />
              ) : (
                <ChatPage />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              {!currentOrganization && organizations.length === 0 ? (
                <Navigate to="/org/setup" replace />
              ) : (
                <DocumentsPage />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/org"
          element={
            <ProtectedRoute>
              {!currentOrganization && organizations.length === 0 ? (
                <Navigate to="/org/setup" replace />
              ) : (
                <OrganizationPage />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              {!currentOrganization && organizations.length === 0 ? (
                <Navigate to="/org/setup" replace />
              ) : (
                <SettingsPage />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              {!currentOrganization && organizations.length === 0 ? (
                <Navigate to="/org/setup" replace />
              ) : (
                <ProfilePage />
              )}
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
