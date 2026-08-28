import { useState, type UIEvent } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type OnChangeFn,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { columns, type Ticker } from '@/pages/screener/components/columns';

type TickerTableProps = {
  tickers: Ticker[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  columnVisibility: VisibilityState;
};

const StickyEdgeGradient = () => (
  <div className="pointer-events-none absolute inset-y-0 right-0 w-3 translate-x-full bg-gradient-to-r from-black/10 to-transparent dark:from-black/30" />
);

const TickerTable = ({
  tickers,
  sorting,
  onSortingChange,
  columnVisibility,
}: TickerTableProps) => {
  const [isScrolled, setIsScrolled] = useState(false);

  const table = useReactTable({
    data: tickers,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    setIsScrolled(event.currentTarget.scrollLeft > 0);
  };

  return (
    <Table
      containerClassName="h-full"
      className="text-xs"
      onScroll={handleScroll}
    >
      <TableHeader className="z-20">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className={
                  header.column.columnDef.meta?.sticky
                    ? 'sticky left-0 z-20 bg-background'
                    : undefined
                }
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                {header.column.columnDef.meta?.sticky && isScrolled && (
                  <StickyEdgeGradient />
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={cn(
                  cell.column.columnDef.meta?.sticky &&
                    'sticky left-0 z-10 bg-background',
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                {cell.column.columnDef.meta?.sticky && isScrolled && (
                  <StickyEdgeGradient />
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TickerTable;
