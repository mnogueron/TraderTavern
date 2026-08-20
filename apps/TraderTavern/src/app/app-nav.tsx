import { NavLink, useNavigate } from 'react-router';
import { useClientMutation } from '@trader-tavern/api-client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';

export function AppNav() {
  const navigate = useNavigate();
  const { data: currentUser, isPending } = useCurrentUser();

  const logoutMutation = useClientMutation('post', '/auth/logout', {
    onSuccess: () => navigate('/login'),
  });

  return (
    <nav className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/about" end>
          About
        </NavLink>
        {currentUser ? (
          <NavLink to="/users" end>
            Users
          </NavLink>
        ) : null}
      </div>
      <div className="flex items-center gap-4">
        {isPending ? null : currentUser ? (
          <>
            <span className="text-sm text-muted-foreground">
              {currentUser.username}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate({})}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <NavLink to="/login" end>
              Login
            </NavLink>
            <NavLink to="/register" end>
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
