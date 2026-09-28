import { AppLayout } from '@/components/layout/app-layout';
import { RootLayout } from '@/components/layout/root-layout';
import { ToastProvider } from '@/components/ui/toast';
import { ProtectedRoute } from '@/components/protected-route';
import { AuthProvider } from '@/context/auth-context';
import { AdminPage } from '@/pages/admin-page';
import { LoginPage } from '@/pages/login-page';
import { PatientDetailPage } from '@/pages/patient-detail-page';
import { PatientsPage } from '@/pages/patients-page';
import { QueuePage } from '@/pages/queue-page';
import { ReportsPage } from '@/pages/reports-page';
import { SessionPage } from '@/pages/session-page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<RootLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route index element={<Navigate to="/queue" replace />} />
                    <Route path="queue" element={<QueuePage />} />
                    <Route path="patients" element={<PatientsPage />} />
                    <Route path="patients/:id" element={<PatientDetailPage />} />
                    <Route path="patients/:id/session" element={<SessionPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="admin" element={<AdminPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/queue" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
