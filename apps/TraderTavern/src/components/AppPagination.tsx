import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { getPageNumbers } from '@/lib/pagination';
import { cn } from '@/lib/utils';

type AppPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: Dispatch<SetStateAction<number>>;
  className?: string;
};

export function AppPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: AppPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

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
      </PaginationContent>
    </Pagination>
  );
}
