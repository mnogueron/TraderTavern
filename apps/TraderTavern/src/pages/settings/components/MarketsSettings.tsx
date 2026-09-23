import { useClientQuery } from '@trader-tavern/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Section } from '@/components/Section';
import EmptyCell from '@/components/EmptyCell';
import { formatDateTime } from '@/lib/format';

const MARKET_TICKERS_LIMIT = 1000;

type MarketSyncRowProps = {
  market: string;
};

// TODO: this approximates "last complete sync" by taking the least-recent
// `refreshedAt` across a market's tickers, since the ticker data only holds a
// per-ticker last-sync date. Once sync history can be searched per market,
// replace this with a proper lookup of the last sync run that fully
// succeeded for the market.
const MarketSyncRow = ({ market }: MarketSyncRowProps) => {
  const { data, isPending } = useClientQuery('get', '/api/finance/screener', {
    params: {
      query: {
        page: 1,
        limit: MARKET_TICKERS_LIMIT,
        filters: JSON.stringify({
          market: { type: 'multiselect', values: [market] },
        }),
      },
    },
  });

  const refreshedDates = (data?.data ?? [])
    .map((ticker) => ticker.refreshedAt)
    .filter((value): value is string => Boolean(value));

  const lastCompleteSync = refreshedDates.length
    ? refreshedDates.reduce((earliest, current) =>
        current < earliest ? current : earliest,
      )
    : null;

  return (
    <TableRow>
      <TableCell className="font-medium">{market}</TableCell>
      <TableCell className="tabular-nums">
        {isPending ? (
          <Skeleton className="h-4 w-32" />
        ) : lastCompleteSync ? (
          formatDateTime(lastCompleteSync)
        ) : (
          <EmptyCell />
        )}
      </TableCell>
    </TableRow>
  );
};

const MarketsSettings = () => {
  const { data: filterOptions, isPending } = useClientQuery(
    'get',
    '/api/finance/screener/filters/options',
  );

  const markets = filterOptions?.markets ?? [];

  return (
    <Section title="Markets">
      {isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : (
        <Table containerClassName="rounded-lg border border-input">
          <TableHeader>
            <TableRow>
              <TableHead>Market</TableHead>
              <TableHead>Last complete sync</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {markets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-sm text-muted-foreground"
                >
                  No markets available.
                </TableCell>
              </TableRow>
            ) : (
              markets.map((market) => (
                <MarketSyncRow key={market} market={market} />
              ))
            )}
          </TableBody>
        </Table>
      )}
    </Section>
  );
};

export default MarketsSettings;
