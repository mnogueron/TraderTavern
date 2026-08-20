import { type SubmitEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useClientMutation } from '@trader-tavern/api-client';
import AuthCard from '@/pages/auth/components/AuthCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const registerMutation = useClientMutation('post', '/auth/register', {
    onSuccess: () => navigate('/users'),
  });

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    registerMutation.mutate({ body: { username, email, password } });
  };

  return (
    <AuthCard
      title="Create an account"
      description="Register a new TraderTavern account."
      footer={
        <span>
          Already have an account?{' '}
          <Link to="/login" className="underline">
            Log in
          </Link>
        </span>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {registerMutation.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Could not create the account. The username or email may already
              be in use.
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  );
};

export default RegisterPage;
