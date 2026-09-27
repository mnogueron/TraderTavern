import { type SubmitEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClientMutation } from '@trader-tavern/api-client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const updateEmailMutation = useClientMutation('patch', '/api/user/me/email', {
    onSuccess: (user) => {
      queryClient.setQueryData(['get', '/api/auth/me'], user);
    },
  });

  const changePasswordMutation = useClientMutation(
    'post',
    '/api/auth/change-password',
    {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
      },
    },
  );

  if (!currentUser) {
    return null;
  }

  const handleEmailSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    updateEmailMutation.mutate({ body: { email } });
  };

  const handlePasswordSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    changePasswordMutation.mutate({ body: { currentPassword, newPassword } });
  };

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Card>
        <form onSubmit={handleEmailSubmit}>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your username and email address.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {updateEmailMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to update email — it may already be in use.
                </AlertDescription>
              </Alert>
            )}
            {updateEmailMutation.isSuccess && (
              <Alert>
                <AlertDescription>Email updated.</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={currentUser.username} disabled />
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
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              type="submit"
              disabled={
                updateEmailMutation.isPending || email === currentUser.email
              }
            >
              {updateEmailMutation.isPending ? 'Saving…' : 'Save email'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={handlePasswordSubmit}>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Requires your current password.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {changePasswordMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Current password is incorrect.
                </AlertDescription>
              </Alert>
            )}
            {changePasswordMutation.isSuccess && (
              <Alert>
                <AlertDescription>Password updated.</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
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
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending
                ? 'Updating…'
                : 'Update password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;
