import { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const RoleGuard = ({ roles, children }: { roles: string[]; children: ReactNode }) => {
  const { data: currentUser, isPending } = useCurrentUser();

  if (isPending) {
    return null;
  }

  if (!currentUser || !roles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleGuard;
