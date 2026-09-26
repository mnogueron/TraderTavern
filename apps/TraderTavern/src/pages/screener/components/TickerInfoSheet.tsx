import { RiExternalLinkLine } from '@remixicon/react';
import { Link } from 'react-router';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import CompanyCell from '@/components/CompanyCell';
import MarketBadge from '@/components/MarketBadge';
import { formatDateTime, formatMarketCap, formatNumber } from '@/lib/format';
import type { Ticker } from '@/pages/screener/components/columns';

type TickerInfoSheetProps = {
  ticker: Ticker | null;
  onOpenChange: (open: boolean) => void;
};

const TickerInfoSheet = ({ ticker, onOpenChange }: TickerInfoSheetProps) => {
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
              <dt className="text-muted-foreground">Sector</dt>
              <dd>{ticker.sector ?? '—'}</dd>

              <dt className="text-muted-foreground">Industry</dt>
              <dd>{ticker.industry ?? '—'}</dd>

              <dt className="text-muted-foreground">Country</dt>
              <dd>{ticker.country ?? '—'}</dd>

              <dt className="text-muted-foreground">Market</dt>
              <dd>
                <MarketBadge market={ticker.market} marketLabel={null} />
              </dd>

              <dt className="text-muted-foreground">Currency</dt>
              <dd>{ticker.currency ?? '—'}</dd>

              <dt className="text-muted-foreground">Price</dt>
              <dd className="tabular-nums">
                {formatNumber(ticker.price, 2, ticker.currency)}
              </dd>

              <dt className="text-muted-foreground">Market cap</dt>
              <dd className="tabular-nums">
                {formatMarketCap(ticker.marketCap, ticker.currency)}
              </dd>

              <dt className="text-muted-foreground">P/E ratio</dt>
              <dd className="tabular-nums">{formatNumber(ticker.peRatio)}</dd>

              <dt className="text-muted-foreground">Employees</dt>
              <dd className="tabular-nums">
                {ticker.employees !== null
                  ? ticker.employees.toLocaleString()
                  : '—'}
              </dd>

              <dt className="text-muted-foreground">Data refreshed</dt>
              <dd className="tabular-nums">
                {formatDateTime(ticker.refreshedAt)}
              </dd>
            </dl>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default TickerInfoSheet;
