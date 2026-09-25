import type { VisibilityState } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { columnMetaById } from '@/pages/screener/components/columns';

type TickerTableSkeletonProps = {
  rows: number;
  fillHeight: boolean;
  columnOrder: string[];
  columnVisibility: VisibilityState;
};

const isVisible = (columnVisibility: VisibilityState, id: string) =>
  columnVisibility[id] !== false;

const skeletonWidth = (label: string) =>
  Math.min(140, Math.max(36, label.length * 7));

const TickerTableSkeleton = ({
  rows,
  fillHeight,
  columnOrder,
  columnVisibility,
}: TickerTableSkeletonProps) => {
  const visibleColumns = columnOrder
    .filter((id) => isVisible(columnVisibility, id))
    .map((id) => ({ id, meta: columnMetaById.get(id) }))
    .filter(
      (column): column is { id: string; meta: NonNullable<typeof column.meta> } =>
        Boolean(column.meta),
    );

  return (
    <Table
      containerClassName={fillHeight ? 'min-h-0 flex-1' : undefined}
      className="text-xs"
    >
      <TableHeader>
        <TableRow>
          {visibleColumns.map(({ id, meta }) => (
            <TableHead
              key={id}
              className={cn(
                meta.sticky && 'sticky left-0 z-20 bg-background',
                meta.align === 'right' && 'text-right',
              )}
            >
              {meta.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="bg-card">
        {Array.from({ length: rows }, (_, index) => (
          <TableRow key={index}>
            {visibleColumns.map(({ id, meta }) => (
              <TableCell
                key={id}
                className={cn(meta.sticky && 'sticky left-0 z-10 bg-card')}
              >
                {id === 'companyName' ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ) : id === 'country' ? (
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-5 shrink-0 rounded-xs" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ) : (
                  <Skeleton
                    className={cn(
                      'h-4',
                      meta.align === 'right' && 'ml-auto',
                    )}
                    style={{ width: skeletonWidth(meta.label) }}
                  />
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TickerTableSkeleton;
