import UsersPage from '@/pages/users/UsersPage';
import RoleGuard from '@/components/auth/RoleGuard';

export default function UsersRoute() {
  return (
    <RoleGuard roles={['admin']}>
      <UsersPage />
    </RoleGuard>
  );
}
