import { type MouseEvent } from 'react';
import { useSearchParams } from 'react-router';
import UserList from '@/pages/users/components/UserList';
import UserListSkeleton from '@/pages/users/components/UserListSkeleton';
import { useClientQuery } from '@trader-tavern/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Always show the first/last page and the 2 pages around the current one,
// collapsing any gap into an ellipsis.
const SIBLING_COUNT = 2;

const getPageNumbers = (
  page: number,
  totalPages: number,
): (number | 'ellipsis')[] => {
  const visiblePages = new Set(
    [
      1,
      totalPages,
      ...Array.from(
        { length: SIBLING_COUNT * 2 + 1 },
        (_, index) => page - SIBLING_COUNT + index,
      ),
    ].filter((candidate) => candidate >= 1 && candidate <= totalPages),
  );

  const pages: (number | 'ellipsis')[] = [];
  let previousPage: number | undefined;
  for (const pageNumber of Array.from(visiblePages).sort((a, b) => a - b)) {
    if (previousPage !== undefined && pageNumber - previousPage > 1) {
      pages.push('ellipsis');
    }
    pages.push(pageNumber);
    previousPage = pageNumber;
  }

  return pages;
};

const UsersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);

  const { data, isPending } = useClientQuery('get', '/user', {
    params: { query: { page, limit } },
  });

  const handlePageChange = (event: MouseEvent, targetPage: number) => {
    event.preventDefault();
    const totalPages = data?.meta.totalPages ?? 1;
    if (targetPage < 1 || targetPage > totalPages || targetPage === page) {
      return;
    }
    setSearchParams((params) => {
      params.set('page', String(targetPage));
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Select value={String(limit)} onValueChange={handleLimitChange}>
          <SelectTrigger aria-label="Page size">
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
      </div>

      {isPending || !data || !meta ? (
        <UserListSkeleton rows={limit} />
      ) : (
        <UserList users={data.data} />
      )}

      {isPending || !data || !meta ? (
        <Skeleton className="mx-auto h-9 w-72" />
      ) : (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={meta.page <= 1}
                onClick={(event) => handlePageChange(event, meta.page - 1)}
              />
            </PaginationItem>
            {getPageNumbers(meta.page, meta.totalPages).map(
              (pageNumber, index) =>
                pageNumber === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === meta.page}
                      onClick={(event) => handlePageChange(event, pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={meta.page >= meta.totalPages}
                onClick={(event) => handlePageChange(event, meta.page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default UsersPage;
