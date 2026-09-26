import MarketsPage from '@/pages/markets/MarketsPage';
import RoleGuard from '@/components/auth/RoleGuard';

export const handle = { title: 'Markets' };

export default function MarketsRoute() {
  return (
    <RoleGuard roles={['admin']}>
      <MarketsPage />
    </RoleGuard>
  );
}
