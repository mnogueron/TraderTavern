import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

type AppPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: Dispatch<SetStateAction<number>>;
  className?: string;
};

// Always show the first/last page and the 2 pages around the current one,
// collapsing any gap into an ellipsis.
const SIBLING_COUNT = 2;

export const getPageNumbers = (
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

export function AppPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: AppPaginationProps) {
  const goToPage = (event: MouseEvent, targetPage: number) => {
    event.preventDefault();
    if (targetPage < 1 || targetPage > totalPages || targetPage === page) {
      return;
    }
    onPageChange(targetPage);
  };

  return (
    <Pagination className={cn('mx-0 w-auto justify-end', className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationFirst
            href="#"
            aria-disabled={page <= 1}
            className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
            onClick={(event) => goToPage(event, 1)}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page <= 1}
            className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
            onClick={(event) => goToPage(event, page - 1)}
          />
        </PaginationItem>
        {getPageNumbers(page, totalPages).map((pageNumber, index) =>
          pageNumber === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href="#"
                isActive={pageNumber === page}
                onClick={(event) => goToPage(event, pageNumber)}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={page >= totalPages}
            className={
              page >= totalPages ? 'pointer-events-none opacity-50' : undefined
            }
            onClick={(event) => goToPage(event, page + 1)}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLast
            href="#"
            aria-disabled={page >= totalPages}
            className={
              page >= totalPages ? 'pointer-events-none opacity-50' : undefined
            }
            onClick={(event) => goToPage(event, totalPages)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
