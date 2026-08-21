import { useState } from 'react';
import { Link } from 'react-router';
import { RiArrowLeftLine, RiEyeLine, RiEyeOffLine } from '@remixicon/react';
import { useClientQuery } from '@trader-tavern/api-client';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import CandlestickChart from '@/pages/ticker/components/CandlestickChart';
import {
  changePercentClassName,
  formatChangePercent,
  formatDateTime,
  formatMarketCap,
  formatNumber,
} from '@/lib/format';

type CandleWindow = '5m' | '1h' | '1d' | '1wk';

const WINDOW_OPTIONS: { value: CandleWindow; label: string }[] = [
  { value: '5m', label: '5m' },
  { value: '1h', label: '1h' },
  { value: '1d', label: '1D' },
  { value: '1wk', label: '1W' },
];

type TickerDetailPageProps = {
  ticker: string;
};

const TickerDetailPage = ({ ticker }: TickerDetailPageProps) => {
  const [window, setWindow] = useState<CandleWindow>('1d');
  const [showPreMarket, setShowPreMarket] = useState(false);

  const { data: tickerData, isPending: isTickerPending } = useClientQuery(
    'get',
    '/finance/ticker/{id}',
    { params: { path: { id: ticker } } },
  );

  const { data: fundamental, isPending: isFundamentalPending } =
    useClientQuery('get', '/finance/ticker/{id}/fundamental', {
      params: { path: { id: ticker } },
    });

  const { data: chart, isPending: isChartPending } = useClientQuery(
    'get',
    '/finance/ticker/{id}/chart',
    { params: { path: { id: ticker }, query: { window } } },
  );

  const { data: marketHours } = useClientQuery(
    'get',
    '/finance/ticker/{id}/market-hours',
    { params: { path: { id: ticker } } },
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link to="/screener" />}
        >
          <RiArrowLeftLine />
        </Button>
        {isTickerPending || !tickerData ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <div>
            <h1 className="text-2xl font-semibold">
              {tickerData.ticker}{' '}
              <span className="text-lg font-normal text-muted-foreground">
                {tickerData.companyName}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Refreshed {formatDateTime(tickerData.refreshedAt)}
            </p>
          </div>
        )}
      </div>

      <div className="grid shrink-0 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
            {isTickerPending || !tickerData ? (
              <Skeleton className="col-span-2 h-24" />
            ) : (
              <>
                <span className="text-muted-foreground">Price</span>
                <span className="text-right tabular-nums">
                  {formatNumber(tickerData.price)}
                </span>
                <span className="text-muted-foreground">Change</span>
                <span
                  className={`text-right tabular-nums ${changePercentClassName(tickerData.changePercent)}`}
                >
                  {formatChangePercent(tickerData.changePercent)}
                </span>
                <span className="text-muted-foreground">Sector</span>
                <span className="text-right">{tickerData.sector ?? '—'}</span>
                <span className="text-muted-foreground">Industry</span>
                <span className="text-right">
                  {tickerData.industry ?? '—'}
                </span>
                <span className="text-muted-foreground">Country</span>
                <span className="text-right">{tickerData.country ?? '—'}</span>
                <span className="text-muted-foreground">Market</span>
                <span className="text-right">{tickerData.market ?? '—'}</span>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Fundamentals</CardTitle>
          </CardHeader>
          <CardContent>
            {isFundamentalPending || !fundamental ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="grid grid-cols-3 gap-y-2 text-sm">
                <span className="text-muted-foreground">Market Cap</span>
                <span className="text-right tabular-nums">
                  {formatMarketCap(fundamental.marketCap)}
                </span>
                <span />
                <span className="text-muted-foreground">P/E</span>
                <span className="text-right tabular-nums">
                  {formatNumber(fundamental.peRatio)}
                </span>
                <span />
                <span className="text-muted-foreground">P/S</span>
                <span className="text-right tabular-nums">
                  {formatNumber(fundamental.psRatio)}
                </span>
                <span />
                <span className="text-muted-foreground">EBITDA</span>
                <span className="text-right tabular-nums">
                  {formatMarketCap(fundamental.ebitda)}
                </span>
                <span />
                <span className="text-muted-foreground">Total Debt</span>
                <span className="text-right tabular-nums">
                  {formatMarketCap(fundamental.totalDebt)}
                </span>
                <span />
                <span className="text-muted-foreground">Debt / Equity</span>
                <span className="text-right tabular-nums">
                  {formatNumber(fundamental.debtToEquity)}
                </span>
                <span />
                <span className="col-span-3 mt-1 text-xs text-muted-foreground">
                  Refreshed {formatDateTime(fundamental.refreshedAt)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="min-h-0 flex-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Candles</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={showPreMarket ? 'default' : 'outline'}
              onClick={() => setShowPreMarket((value) => !value)}
            >
              {showPreMarket ? <RiEyeLine /> : <RiEyeOffLine />}
              Pre/Post-market
            </Button>
            <ButtonGroup>
              {WINDOW_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={window === option.value ? 'default' : 'outline'}
                  onClick={() => setWindow(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1">
          {isChartPending || !chart ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <CandlestickChart
              candles={chart.candles}
              window={chart.window}
              marketHours={marketHours}
              showPreMarket={showPreMarket}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TickerDetailPage;
