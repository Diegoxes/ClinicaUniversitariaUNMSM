import { getStoredUser } from '@/lib/api';
import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedRoute() {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
