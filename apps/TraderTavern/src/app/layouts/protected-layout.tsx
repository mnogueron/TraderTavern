import { Outlet } from 'react-router';
import { AppNav } from '@/app/app-nav';
import RequireAuth from '@/components/auth/RequireAuth';

export default function ProtectedLayout() {
  return (
    <RequireAuth>
      <AppNav />
      <Outlet />
    </RequireAuth>
  );
}
