import type { ColumnDef } from '@tanstack/react-table';
import type { components } from '@trader-tavern/api-client';
import CompanyCell from '@/components/table/CompanyCell';
import MarketBadge from '@/components/MarketBadge';
import RelativeDateTime from '@/components/RelativeDateTime';
import TickerRowMenu from '@/pages/tickers/components/TickerRowMenu';
import TickerStatusBadge from '@/pages/tickers/components/TickerStatusBadge';

export type TickerSummary = components['schemas']['TickerSummaryDto'];

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    stopRowClick?: boolean;
  }
}

type TickersColumnsOptions = {
  onShowDetails: (ticker: TickerSummary) => void;
  onSync: (ticker: TickerSummary) => void;
  onToggleStatus: (ticker: TickerSummary) => void;
  onDelete: (ticker: TickerSummary) => void;
};

export const buildTickersColumns = ({
  onShowDetails,
  onSync,
  onToggleStatus,
  onDelete,
}: TickersColumnsOptions): ColumnDef<TickerSummary>[] => [
  {
    id: 'company',
    header: 'Company',
    cell: ({ row }) => (
      <CompanyCell
        ticker={row.original.ticker}
        companyName={row.original.companyName}
        logoUrl={row.original.logoUrl}
      />
    ),
  },
  {
    accessorKey: 'isin',
    header: 'ISIN',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.isin}</span>
    ),
  },
  {
    id: 'market',
    header: 'Market',
    cell: ({ row }) => (
      <MarketBadge
        market={row.original.market}
        marketLabel={row.original.marketLabel}
      />
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <TickerStatusBadge
        status={row.original.status}
        lastError={row.original.lastError}
      />
    ),
  },
  {
    accessorKey: 'lastFullSyncedAt',
    header: 'Last sync',
    cell: ({ row }) => (
      <span className="tabular-nums">
        <RelativeDateTime value={row.original.lastFullSyncedAt} />
      </span>
    ),
  },
  {
    id: 'actions',
    header: '',
    meta: { stopRowClick: true },
    cell: ({ row }) => (
      <TickerRowMenu
        ticker={row.original}
        onShowDetails={() => onShowDetails(row.original)}
        onSync={() => onSync(row.original)}
        onToggleStatus={() => onToggleStatus(row.original)}
        onDelete={() => onDelete(row.original)}
      />
    ),
  },
];
