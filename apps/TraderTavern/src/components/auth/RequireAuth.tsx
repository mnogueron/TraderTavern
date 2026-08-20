import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { data: currentUser, isPending } = useCurrentUser();
  const location = useLocation();

  if (isPending) {
    return null;
  }

  if (!currentUser) {
    const redirectTo = encodeURIComponent(
      `${location.pathname}${location.search}`,
    );
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  return children;
};

export default RequireAuth;
