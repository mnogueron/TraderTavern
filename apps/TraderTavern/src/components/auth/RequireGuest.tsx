import { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const RequireGuest = ({ children }: { children: ReactNode }) => {
  const { data: currentUser, isPending } = useCurrentUser();

  if (isPending) {
    return null;
  }

  if (currentUser) {
    return <Navigate to="/users" replace />;
  }

  return children;
};

export default RequireGuest;
