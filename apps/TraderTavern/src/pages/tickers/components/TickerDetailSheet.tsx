import { AlertCircleIcon } from 'lucide-react';
import { RiExternalLinkLine } from '@remixicon/react';
import { Link } from 'react-router';
import { useClientQuery } from '@trader-tavern/api-client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import CompanyCell from '@/components/table/CompanyCell';
import MarketBadge from '@/components/MarketBadge';
import TickerStatusBadge from '@/pages/tickers/components/TickerStatusBadge';
import RelativeDateTime from '@/components/RelativeDateTime';
import { useFormatNumber } from '@/hooks/useFormatNumber';
import type { components } from '@trader-tavern/api-client';

type TickerSummary = components['schemas']['TickerSummaryDto'];

type TickerDetailSheetProps = {
  ticker: TickerSummary | null;
  onOpenChange: (open: boolean) => void;
};

const TickerDetailSheet = ({
  ticker,
  onOpenChange,
}: TickerDetailSheetProps) => {
  const { formatCurrency, formatMarketCap, formatNumber } = useFormatNumber();
  const { data, isPending } = useClientQuery(
    'get',
    '/api/finance/ticker/{id}',
    { params: { path: { id: ticker?.ticker ?? '' } } },
    { enabled: !!ticker },
  );

  const { data: marketHours } = useClientQuery(
    'get',
    '/api/finance/ticker/{id}/market-hours',
    { params: { path: { id: ticker?.ticker ?? '' } } },
    { enabled: !!ticker },
  );

  return (
    <Sheet open={!!ticker} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Ticker details</SheetTitle>
          <SheetDescription>
            {ticker ? `${ticker.ticker} — ${ticker.companyName ?? '—'}` : ''}
          </SheetDescription>
        </SheetHeader>

        {ticker && (
          <div className="flex flex-col gap-4 overflow-auto px-4 pb-4">
            {ticker.status === 'disabled' && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Ticker disabled</AlertTitle>
                <AlertDescription>
                  {ticker.lastError ?? 'No error message recorded.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <CompanyCell
                ticker={ticker.ticker}
                companyName={ticker.companyName}
                logoUrl={ticker.logoUrl}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                render={<Link to={`/ticker/${ticker.ticker}`} />}
              >
                <RiExternalLinkLine />
                Full page
              </Button>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <TickerStatusBadge
                  status={ticker.status}
                  lastError={ticker.lastError}
                />
              </dd>

              <dt className="text-muted-foreground">Ticker</dt>
              <dd className="font-mono text-xs">{ticker.ticker}</dd>

              <dt className="text-muted-foreground">ISIN</dt>
              <dd className="font-mono text-xs">{ticker.isin}</dd>

              <dt className="text-muted-foreground">Market</dt>
              <dd>
                <MarketBadge
                  market={ticker.market}
                  marketLabel={ticker.marketLabel}
                />
              </dd>

              <dt className="text-muted-foreground">Last full sync</dt>
              <dd className="tabular-nums">
                <RelativeDateTime value={ticker.lastFullSyncedAt} />
              </dd>

              <dt className="text-muted-foreground">Error count</dt>
              <dd className="tabular-nums">{ticker.errorCount}</dd>

              <dt className="text-muted-foreground">Disabled since</dt>
              <dd className="tabular-nums">
                <RelativeDateTime value={ticker.hiddenAt} />
              </dd>

              {marketHours && (
                <>
                  <dt className="text-muted-foreground">Timezone</dt>
                  <dd>{marketHours.timezone}</dd>
                </>
              )}
            </dl>

            {isPending || !data ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Sector</dt>
                <dd>{data.sector ?? '—'}</dd>

                <dt className="text-muted-foreground">Industry</dt>
                <dd>{data.industry ?? '—'}</dd>

                <dt className="text-muted-foreground">Country</dt>
                <dd>{data.country ?? '—'}</dd>

                <dt className="text-muted-foreground">Currency</dt>
                <dd>{data.currency ?? '—'}</dd>

                <dt className="text-muted-foreground">Price</dt>
                <dd className="tabular-nums">
                  {formatCurrency(data.price, data.currency, 2)}
                </dd>

                <dt className="text-muted-foreground">Market cap</dt>
                <dd className="tabular-nums">
                  {formatMarketCap(data.marketCap, data.currency)}
                </dd>

                <dt className="text-muted-foreground">P/E ratio</dt>
                <dd className="tabular-nums">{formatNumber(data.peRatio)}</dd>

                <dt className="text-muted-foreground">Employees</dt>
                <dd className="tabular-nums">
                  {formatNumber(data.employees, 0)}
                </dd>

                <dt className="text-muted-foreground">Data refreshed</dt>
                <dd className="tabular-nums">
                  <RelativeDateTime value={data.refreshedAt} />
                </dd>
              </dl>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default TickerDetailSheet;
