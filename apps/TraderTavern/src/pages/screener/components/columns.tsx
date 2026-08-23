import type { Column, ColumnDef } from '@tanstack/react-table';
import type { ApiResponse } from '@trader-tavern/api-client';
import { ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  changePercentClassName,
  formatChangePercent,
  formatMarketCap,
  formatNumber,
} from '@/lib/format';

export type Ticker = ApiResponse<'get', '/finance/screener'>[number];

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    sticky?: boolean;
  }
}

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
      className="-ml-3 h-7 text-xs"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
    </Button>
  </div>
);

const ChangeBadge = ({ value }: { value: number | null }) => (
  <div className="flex justify-end">
    <Badge
      variant="outline"
      className={`tabular-nums ${changePercentClassName(value)}`}
    >
      {formatChangePercent(value)}
    </Badge>
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
    meta: { sticky: true },
  },
  {
    accessorKey: 'companyName',
    header: 'Company',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.logoUrl ? (
          <img
            src={row.original.logoUrl}
            alt=""
            className="h-4 w-4 shrink-0 rounded-sm object-contain"
            loading="lazy"
          />
        ) : (
          <div className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate">{row.original.companyName}</span>
      </div>
    ),
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
      <SortableHeader column={column} label="1D" align="right" />
    ),
    cell: ({ row }) => <ChangeBadge value={row.original.changePercent} />,
  },
  {
    accessorKey: 'changePercent1w',
    header: ({ column }) => (
      <SortableHeader column={column} label="1W" align="right" />
    ),
    cell: ({ row }) => <ChangeBadge value={row.original.changePercent1w} />,
  },
  {
    accessorKey: 'changePercent1m',
    header: ({ column }) => (
      <SortableHeader column={column} label="1M" align="right" />
    ),
    cell: ({ row }) => <ChangeBadge value={row.original.changePercent1m} />,
  },
  {
    accessorKey: 'changePercentYtd',
    header: ({ column }) => (
      <SortableHeader column={column} label="YTD" align="right" />
    ),
    cell: ({ row }) => <ChangeBadge value={row.original.changePercentYtd} />,
  },
  {
    accessorKey: 'changePercent1y',
    header: ({ column }) => (
      <SortableHeader column={column} label="1Y" align="right" />
    ),
    cell: ({ row }) => <ChangeBadge value={row.original.changePercent1y} />,
  },
  {
    accessorKey: 'country',
    header: 'Country',
    cell: ({ row }) => row.original.country ?? '—',
  },
];
