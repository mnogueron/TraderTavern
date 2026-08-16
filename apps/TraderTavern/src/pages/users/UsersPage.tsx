import { type MouseEvent } from 'react';
import { useSearchParams } from 'react-router';
import UserList from '@/pages/users/components/UserList';
import { useClientQuery } from '@trader-tavern/api-client';
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

const getPageNumbers = (
  page: number,
  totalPages: number,
): (number | 'ellipsis')[] => {
  const pages: (number | 'ellipsis')[] = [];
  const window = new Set([1, totalPages, page - 1, page, page + 1]);

  let previous: number | undefined;
  for (const candidate of Array.from(window).sort((a, b) => a - b)) {
    if (candidate < 1 || candidate > totalPages) {
      continue;
    }
    if (previous !== undefined && candidate - previous > 1) {
      pages.push('ellipsis');
    }
    pages.push(candidate);
    previous = candidate;
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

  if (isPending || !data) {
    return null;
  }

  const { meta } = data;

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

      <UserList users={data.data} />

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
    </div>
  );
};

export default UsersPage;
