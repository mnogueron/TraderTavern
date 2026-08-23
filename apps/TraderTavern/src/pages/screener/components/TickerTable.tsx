import type { ApiResponse } from '@trader-tavern/api-client';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { columns } from '@/pages/screener/components/columns';

type TickerTableProps = {
  tickers: ApiResponse<'get', '/finance/screener'>['data'];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
};

const TickerTable = ({ tickers, sorting, onSortingChange }: TickerTableProps) => {
  const table = useReactTable({
    data: tickers,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table containerClassName="h-full" className="text-xs">
      <TableHeader>
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
                className={
                  cell.column.columnDef.meta?.sticky
                    ? 'sticky left-0 z-10 bg-background'
                    : undefined
                }
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TickerTable;
