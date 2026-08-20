import { type SubmitEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useClientMutation } from '@trader-tavern/api-client';
import AuthCard from '@/pages/auth/components/AuthCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [issuedToken, setIssuedToken] = useState<string | null>(null);

  const requestResetMutation = useClientMutation('post', '/auth/reset-password', {
    onSuccess: (data) => {
      if (data?.token) {
        setIssuedToken(data.token);
        setToken(data.token);
      }
    },
  });

  const confirmResetMutation = useClientMutation('post', '/auth/reset-password', {
    onSuccess: () => navigate('/login'),
  });

  const handleRequestReset = (event: SubmitEvent) => {
    event.preventDefault();
    requestResetMutation.mutate({ body: { email } });
  };

  const handleConfirmReset = (event: SubmitEvent) => {
    event.preventDefault();
    confirmResetMutation.mutate({ body: { email, token, newPassword } });
  };

  return (
    <AuthCard
      title="Reset password"
      description="Request a reset token, then set a new password."
      footer={
        <span>
          Remembered your password?{' '}
          <Link to="/login" className="underline">
            Log in
          </Link>
        </span>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleRequestReset}>
        {requestResetMutation.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              No account was found for this email.
            </AlertDescription>
          </Alert>
        ) : null}
        {issuedToken ? (
          <Alert>
            <AlertDescription>
              No email delivery is configured yet — here is your reset token
              for development purposes:{' '}
              <span className="font-mono break-all">{issuedToken}</span>
            </AlertDescription>
          </Alert>
        ) : null}
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
        <Button type="submit" disabled={requestResetMutation.isPending}>
          {requestResetMutation.isPending
            ? 'Requesting token…'
            : 'Request reset token'}
        </Button>
      </form>

      <form className="flex flex-col gap-4 border-t pt-4" onSubmit={handleConfirmReset}>
        {confirmResetMutation.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Invalid or expired reset token.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label htmlFor="token">Reset token</Label>
          <Input
            id="token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={confirmResetMutation.isPending}>
          {confirmResetMutation.isPending ? 'Resetting…' : 'Set new password'}
        </Button>
      </form>
    </AuthCard>
  );
};

export default ResetPasswordPage;
