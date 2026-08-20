import { Outlet } from 'react-router';
import RequireGuest from '@/components/auth/RequireGuest';

export default function GuestLayout() {
  return (
    <RequireGuest>
      <Outlet />
    </RequireGuest>
  );
}
