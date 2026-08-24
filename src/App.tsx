import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { AuthProvider } from '@/context/AuthContext';
import { FranchiseAuthProvider } from '@/context/FranchiseAuthContext';
import { ScrollRestoration } from '@/components/ScrollRestoration';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

// Pages
import { Home } from '@/pages/Home';
import { TasimaKosullari } from '@/pages/TasimaKosullari';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { TermsOfService } from '@/pages/TermsOfService';
import { AsistanPage } from '@/pages/AsistanPage';
import { TaskDetailPage } from '@/pages/TaskDetailPage';
import { AdminPanel } from '@/pages/AdminPanel';
import FranchiseDashboard from '@/pages/FranchiseDashboard';
import { LoginPage } from '@/pages/LoginPage';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RealtimeBridge() {
  useRealtimeSync();
  return null;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function AppRouter() {
  return (
    <RoutedErrorBoundary>
      <ScrollRestoration />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/tasima-kosullari" component={TasimaKosullari} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/login" component={LoginPage} />
        <Route path="/asistan" component={AsistanPage} />
        <Route path="/assistant/task/:id" component={TaskDetailPage} />
        <Route path="/asistan/task/:id" component={TaskDetailPage} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/bayi" component={FranchiseDashboard} />
        <Route path="/bayi/dashboard" component={FranchiseDashboard} />
        <Route path="/bayi-paneli">
          {() => {
            const [, setLocation] = useLocation();
            React.useEffect(() => {
              setLocation('/bayi', { replace: true });
            }, [setLocation]);
            return null;
          }}
        </Route>
        <Route path="/franchise" component={FranchiseDashboard} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FranchiseAuthProvider>
          <TooltipProvider>
            <RealtimeBridge />
            <WouterRouter base={(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}>
              <AppRouter />
            </WouterRouter>
            <PWAInstallPrompt />
            <Toaster />
          </TooltipProvider>
        </FranchiseAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
