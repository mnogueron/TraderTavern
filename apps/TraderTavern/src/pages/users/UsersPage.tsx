import { type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router';
import UserList from '@/pages/users/components/UserList';
import UserListSkeleton from '@/pages/users/components/UserListSkeleton';
import { useClientQuery } from '@trader-tavern/api-client';
import { AppPagination } from '@/components/AppPagination';
import { TableFooter } from '@/components/TableFooter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const UsersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);

  const { data, isPending } = useClientQuery('get', '/api/user', {
    params: { query: { page, limit } },
  });

  const handlePageChange: Dispatch<SetStateAction<number>> = (value) => {
    setSearchParams((params) => {
      const nextPage = typeof value === 'function' ? value(page) : value;
      params.set('page', String(nextPage));
      return params;
    });
  };

  const handleLimitChange = (value: string | null) => {
    if (!value) {
      return;
    }
    setSearchParams((params) => {
      params.set('limit', value);
      params.set('page', '1');
      return params;
    });
  };

  const meta = data?.meta;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-h-[600px] flex-1 flex-col overflow-hidden rounded-md border">
        {isPending || !data ? (
          <UserListSkeleton rows={limit} />
        ) : (
          <UserList users={data.data} />
        )}
        {meta && (
          <TableFooter>
            <Select value={String(limit)} onValueChange={handleLimitChange}>
              <SelectTrigger aria-label="Page size" size="sm">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AppPagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={handlePageChange}
            />
          </TableFooter>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
