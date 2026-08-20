import { type SubmitEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useClientMutation } from '@trader-tavern/api-client';
import AuthCard from '@/pages/auth/components/AuthCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useClientMutation('post', '/auth/login', {
    onSuccess: () => navigate('/users'),
  });

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    loginMutation.mutate({ body: { username, password } });
  };

  return (
    <AuthCard
      title="Log in"
      description="Sign in to your TraderTavern account."
      footer={
        <span>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="underline">
            Register
          </Link>
        </span>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {loginMutation.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Invalid username or password.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/reset-password"
              className="text-sm text-muted-foreground underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  );
};

export default LoginPage;
