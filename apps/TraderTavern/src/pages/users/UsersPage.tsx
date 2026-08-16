import UserList from '@/pages/users/components/UserList';
import { useClientQuery } from '@trader-tavern/api-client';

const UsersPage = () => {
  const { data, isPending } = useClientQuery('get', '/user');

  if (isPending) {
    return null;
  }

  return <UserList users={data} />;
};

export default UsersPage;
