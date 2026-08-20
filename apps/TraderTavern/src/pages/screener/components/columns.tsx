import type { Column, ColumnDef } from '@tanstack/react-table';
import type { ApiResponse } from '@trader-tavern/api-client';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type Ticker = ApiResponse<'get', '/finance/screener'>[number];

const formatMarketCap = (value: number | null) => {
  if (value === null) {
    return '—';
  }
  const units: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
  ];
  for (const [threshold, suffix] of units) {
    if (value >= threshold) {
      return `${(value / threshold).toFixed(2)}${suffix}`;
    }
  }
  return value.toLocaleString();
};

const formatNumber = (value: number | null, digits = 2) =>
  value === null ? '—' : value.toFixed(digits);

const formatChangePercent = (value: number | null) => {
  if (value === null) {
    return '—';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const changePercentClassName = (value: number | null) => {
  if (value === null || value === 0) {
    return 'text-muted-foreground';
  }
  return value > 0 ? 'text-emerald-600' : 'text-red-600';
};

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
      <span className="font-medium">{row.original.ticker}</span>
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
        {formatMarketCap(row.original.marketCap)}
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
        {formatNumber(row.original.price)}
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
