import type { ColumnDef } from '@tanstack/react-table';
import type { components } from '@trader-tavern/api-client';
import CompanyCell from '@/components/table/CompanyCell';
import MarketBadge from '@/components/MarketBadge';
import RelativeDateTime from '@/components/RelativeDateTime';
import SyncHealthReasonBadge from '@/pages/sync/components/SyncHealthReasonBadge';
import { formatDuration } from '@/lib/format';

export type TickerSyncHealth = components['schemas']['TickerSyncHealthDto'];

export const buildSyncHealthColumns = (
  showReason: boolean,
): ColumnDef<TickerSyncHealth>[] => [
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
    accessorKey: 'lastFullSyncedAt',
    header: 'Last full sync',
    cell: ({ row }) => (
      <span className="tabular-nums">
        <RelativeDateTime value={row.original.lastFullSyncedAt} />
      </span>
    ),
  },
  {
    id: 'overdueBy',
    header: 'Overdue by',
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.minutesPastClose === null
          ? '—'
          : formatDuration(row.original.minutesPastClose * 60_000)}
      </span>
    ),
  },
  ...(showReason
    ? ([
        {
          id: 'reason',
          header: 'Reason',
          cell: ({ row }) =>
            row.original.reason ? (
              <SyncHealthReasonBadge reason={row.original.reason} />
            ) : null,
        },
      ] satisfies ColumnDef<TickerSyncHealth>[])
    : []),
];
