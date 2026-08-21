import type { Column, ColumnDef } from '@tanstack/react-table';
import type { ApiResponse } from '@trader-tavern/api-client';
import { ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  changePercentClassName,
  formatChangePercent,
  formatMarketCap,
  formatNumber,
} from '@/lib/format';

export type Ticker = ApiResponse<'get', '/finance/screener'>[number];

type SortableHeaderProps = {
  column: Column<Ticker, unknown>;
  label: string;
  align?: 'left' | 'right';
};

const SortableHeader = ({
  column,
  label,
  align = 'left',
}: SortableHeaderProps) => (
  <div className={align === 'right' ? 'text-right' : undefined}>
    <Button
      variant="ghost"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  </div>
);

export const columns: ColumnDef<Ticker>[] = [
  {
    accessorKey: 'ticker',
    header: ({ column }) => <SortableHeader column={column} label="Ticker" />,
    cell: ({ row }) => (
      <Link
        to={`/ticker/${row.original.ticker}`}
        className="font-medium hover:underline"
      >
        {row.original.ticker}
      </Link>
    ),
  },
  {
    accessorKey: 'companyName',
    header: 'Company',
  },
  {
    accessorKey: 'sector',
    header: 'Sector',
    cell: ({ row }) => row.original.sector ?? '—',
  },
  {
    accessorKey: 'industry',
    header: 'Industry',
    cell: ({ row }) => row.original.industry ?? '—',
  },
  {
    accessorKey: 'marketCap',
    header: ({ column }) => (
      <SortableHeader column={column} label="Market Cap" align="right" />
    ),
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {formatMarketCap(row.original.marketCap, row.original.currency)}
      </div>
    ),
  },
  {
    accessorKey: 'peRatio',
    header: ({ column }) => (
      <SortableHeader column={column} label="P/E" align="right" />
    ),
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {formatNumber(row.original.peRatio)}
      </div>
    ),
  },
  {
    accessorKey: 'price',
    header: ({ column }) => (
      <SortableHeader column={column} label="Price" align="right" />
    ),
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {formatNumber(row.original.price, 2, row.original.currency)}
      </div>
    ),
  },
  {
    accessorKey: 'changePercent',
    header: ({ column }) => (
      <SortableHeader column={column} label="Change" align="right" />
    ),
    cell: ({ row }) => (
      <div
        className={`text-right tabular-nums ${changePercentClassName(row.original.changePercent)}`}
      >
        {formatChangePercent(row.original.changePercent)}
      </div>
    ),
  },
  {
    accessorKey: 'country',
    header: 'Country',
    cell: ({ row }) => row.original.country ?? '—',
  },
];
