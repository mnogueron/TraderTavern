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
  formatDate,
  formatDateTime,
  formatMarketCap,
  formatMonthYear,
  formatNumber,
  formatPercent,
} from '@/lib/format';

type CandleWindow = '5m' | '1h' | '1d' | '1wk';

const WINDOW_OPTIONS: { value: CandleWindow; label: string }[] = [
  { value: '5m', label: '5m' },
  { value: '1h', label: '1h' },
  { value: '1d', label: '1D' },
  { value: '1wk', label: '1W' },
];

const StatGroup = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {title}
    </h3>
    <div className="grid grid-cols-2 gap-y-1.5 text-sm">{children}</div>
  </div>
);

const StatRow = ({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) => (
  <>
    <span className="text-muted-foreground">{label}</span>
    <span className={`text-right tabular-nums ${valueClassName ?? ''}`}>
      {value}
    </span>
  </>
);

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
                  {formatNumber(tickerData.price, 2, tickerData.currency)}
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
                <span className="text-muted-foreground">Employees</span>
                <span className="text-right tabular-nums">
                  {tickerData.employees?.toLocaleString() ?? '—'}
                </span>
                <span className="text-muted-foreground">Fiscal Year End</span>
                <span className="text-right">
                  {formatMonthYear(tickerData.fiscalYearEnd)}
                </span>
                <span className="text-muted-foreground">MR Quarter</span>
                <span className="text-right">
                  {formatMonthYear(tickerData.mostRecentQuarter)}
                </span>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {isTickerPending || !tickerData ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(
                  [
                    ['1D', tickerData.changePercent],
                    ['1W', tickerData.changePercent1w],
                    ['1M', tickerData.changePercent1m],
                    ['3M', tickerData.changePercent3m],
                    ['6M', tickerData.changePercent6m],
                    ['YTD', tickerData.changePercentYtd],
                    ['1Y', tickerData.changePercent1y],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="flex shrink-0 flex-col items-center gap-1 rounded-md border bg-muted/40 px-3 py-2"
                  >
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                    <span
                      className={`text-sm tabular-nums ${changePercentClassName(value)}`}
                    >
                      {formatChangePercent(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            {isTickerPending || !tickerData ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {tickerData.description ?? 'No description available.'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Key Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {isFundamentalPending || !fundamental || !tickerData ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <StatGroup title="Company">
                  <StatRow
                    label="Market Cap"
                    value={formatMarketCap(fundamental.marketCap, tickerData.currency)}
                  />
                  <StatRow
                    label="Enterprise Value"
                    value={formatMarketCap(fundamental.enterpriseValue, tickerData.currency)}
                  />
                  <StatRow
                    label="Revenue (TTM)"
                    value={formatMarketCap(fundamental.revenue, tickerData.currency)}
                  />
                  <StatRow
                    label="Gross Profit"
                    value={formatMarketCap(fundamental.grossProfit, tickerData.currency)}
                  />
                  <StatRow
                    label="Net Income (TTM)"
                    value={formatMarketCap(fundamental.netIncome, tickerData.currency)}
                  />
                  <StatRow
                    label="Revenue/Share"
                    value={formatNumber(fundamental.revenuePerShare, 3, tickerData.currency)}
                  />
                </StatGroup>

                <StatGroup title="Valuation">
                  <StatRow label="P/E (Trailing)" value={formatNumber(fundamental.peRatio)} />
                  <StatRow label="P/E (Forward)" value={formatNumber(fundamental.forwardPE)} />
                  <StatRow label="PEG" value={formatNumber(fundamental.pegRatio)} />
                  <StatRow label="EV/EBITDA" value={formatNumber(fundamental.evToEbitda)} />
                  <StatRow label="EV/Revenue" value={formatNumber(fundamental.evToRevenue)} />
                  <StatRow label="P/S" value={formatNumber(fundamental.psRatio)} />
                  <StatRow label="P/B" value={formatNumber(fundamental.priceToBook)} />
                  <StatRow label="EPS (TTM)" value={formatNumber(fundamental.epsTrailing)} />
                  <StatRow label="EPS (Forward)" value={formatNumber(fundamental.epsForward)} />
                </StatGroup>

                <StatGroup title="52W Range">
                  <StatRow
                    label="52W High"
                    value={formatNumber(fundamental.fiftyTwoWeekHigh, 2, tickerData.currency)}
                  />
                  <StatRow
                    label="52W Low"
                    value={formatNumber(fundamental.fiftyTwoWeekLow, 2, tickerData.currency)}
                  />
                </StatGroup>

                <StatGroup title="Profitability">
                  <StatRow
                    label="Gross Margin"
                    value={formatChangePercent(fundamental.grossMargin)}
                    valueClassName={changePercentClassName(fundamental.grossMargin)}
                  />
                  <StatRow
                    label="Oper. Margin"
                    value={formatChangePercent(fundamental.operatingMargin)}
                    valueClassName={changePercentClassName(fundamental.operatingMargin)}
                  />
                  <StatRow
                    label="EBITDA Margin"
                    value={formatChangePercent(fundamental.ebitdaMargin)}
                    valueClassName={changePercentClassName(fundamental.ebitdaMargin)}
                  />
                  <StatRow
                    label="Profit Margin"
                    value={formatChangePercent(fundamental.profitMargin)}
                    valueClassName={changePercentClassName(fundamental.profitMargin)}
                  />
                  <StatRow
                    label="ROE"
                    value={formatChangePercent(fundamental.returnOnEquity)}
                    valueClassName={changePercentClassName(fundamental.returnOnEquity)}
                  />
                  <StatRow
                    label="ROA"
                    value={formatChangePercent(fundamental.returnOnAssets)}
                    valueClassName={changePercentClassName(fundamental.returnOnAssets)}
                  />
                </StatGroup>

                <StatGroup title="Growth">
                  <StatRow
                    label="Revenue Growth"
                    value={formatChangePercent(fundamental.revenueGrowth)}
                    valueClassName={changePercentClassName(fundamental.revenueGrowth)}
                  />
                  <StatRow
                    label="Earnings Growth"
                    value={formatChangePercent(fundamental.earningsGrowth)}
                    valueClassName={changePercentClassName(fundamental.earningsGrowth)}
                  />
                </StatGroup>

                <StatGroup title="Cash Flow & Leverage">
                  <StatRow
                    label="Operating CF"
                    value={formatMarketCap(fundamental.operatingCashflow, tickerData.currency)}
                    valueClassName={changePercentClassName(fundamental.operatingCashflow)}
                  />
                  <StatRow
                    label="CapEx (TTM)"
                    value={formatMarketCap(fundamental.capex, tickerData.currency)}
                  />
                  <StatRow
                    label="FCF Margin"
                    value={formatChangePercent(fundamental.fcfMargin)}
                    valueClassName={changePercentClassName(fundamental.fcfMargin)}
                  />
                  <StatRow
                    label="FCF Yield"
                    value={formatChangePercent(fundamental.fcfYield)}
                    valueClassName={changePercentClassName(fundamental.fcfYield)}
                  />
                  <StatRow
                    label="Net Debt"
                    value={formatMarketCap(fundamental.netDebt, tickerData.currency)}
                  />
                  <StatRow
                    label="Net Debt/EBITDA"
                    value={formatNumber(fundamental.netDebtToEbitda)}
                  />
                </StatGroup>

                <StatGroup title="Balance Sheet">
                  <StatRow label="Debt/Equity" value={formatNumber(fundamental.debtToEquity)} />
                  <StatRow label="Current Ratio" value={formatNumber(fundamental.currentRatio)} />
                  <StatRow label="Quick Ratio" value={formatNumber(fundamental.quickRatio)} />
                  <StatRow
                    label="Book Value/Sh"
                    value={formatNumber(fundamental.bookValuePerShare, 4, tickerData.currency)}
                  />
                  <StatRow
                    label="Cash/Share"
                    value={formatNumber(fundamental.cashPerShare, 3, tickerData.currency)}
                  />
                </StatGroup>

                <StatGroup title="Dividends">
                  <StatRow
                    label="Fwd Div Rate"
                    value={formatNumber(fundamental.forwardDividendRate, 4, tickerData.currency)}
                  />
                  <StatRow
                    label="Trail. Div Rate"
                    value={formatNumber(fundamental.trailingDividendRate, 4, tickerData.currency)}
                  />
                  <StatRow label="Div. Yield" value={formatPercent(fundamental.dividendYield)} />
                  <StatRow
                    label="5Y Avg Yield"
                    value={formatPercent(fundamental.fiveYearAvgDividendYield)}
                  />
                  <StatRow label="Payout Ratio" value={formatPercent(fundamental.payoutRatio)} />
                  <StatRow
                    label="Ex-Div Date"
                    value={formatDate(fundamental.exDividendDate)}
                  />
                </StatGroup>

                <StatGroup title="Analyst Consensus">
                  <StatRow label="Rating" value={fundamental.analystRating ?? '—'} />
                  <StatRow
                    label="Target (Mean)"
                    value={formatNumber(fundamental.analystTargetMean, 2, tickerData.currency)}
                  />
                  <StatRow
                    label="Upside (mean)"
                    value={formatChangePercent(
                      fundamental.analystTargetMean != null && tickerData.price
                        ? ((fundamental.analystTargetMean - tickerData.price) / tickerData.price) * 100
                        : null,
                    )}
                    valueClassName={changePercentClassName(
                      fundamental.analystTargetMean != null && tickerData.price
                        ? ((fundamental.analystTargetMean - tickerData.price) / tickerData.price) * 100
                        : null,
                    )}
                  />
                  <StatRow
                    label="Target Range"
                    value={`${formatNumber(fundamental.analystTargetLow, 2, tickerData.currency)} – ${formatNumber(fundamental.analystTargetHigh, 2, tickerData.currency)}`}
                  />
                  <StatRow label="# Analysts" value={fundamental.analystCount ?? '—'} />
                </StatGroup>

                <StatGroup title="Ownership">
                  <StatRow
                    label="Shares Out."
                    value={formatMarketCap(fundamental.sharesOutstanding, null)}
                  />
                  <StatRow label="Float" value={formatMarketCap(fundamental.floatShares, null)} />
                  <StatRow
                    label="Insiders"
                    value={formatPercent(fundamental.insidersPercent)}
                  />
                  <StatRow
                    label="Institutions"
                    value={formatPercent(fundamental.institutionsPercent)}
                  />
                </StatGroup>

                <StatGroup title="Technical">
                  <StatRow
                    label="SMA 50"
                    value={formatNumber(fundamental.sma50, 2, tickerData.currency)}
                  />
                  <StatRow
                    label="SMA 200"
                    value={formatNumber(fundamental.sma200, 2, tickerData.currency)}
                  />
                  <StatRow label="Beta" value={formatNumber(fundamental.beta)} />
                  <StatRow
                    label="S&P 52W Chg"
                    value={formatChangePercent(fundamental.sp500Change52w)}
                    valueClassName={changePercentClassName(fundamental.sp500Change52w)}
                  />
                  <StatRow
                    label="Avg Vol (30d)"
                    value={formatMarketCap(fundamental.avgVolume30d, null)}
                  />
                  <StatRow
                    label="Avg Vol (10d)"
                    value={formatMarketCap(fundamental.avgVolume10d, null)}
                  />
                </StatGroup>

                <StatGroup title="Technical Indicators">
                  <StatRow label="RSI (14)" value={formatNumber(tickerData.rsi14, 1)} />
                  <StatRow label="MACD" value={formatNumber(tickerData.macd, 4)} />
                  <StatRow label="MACD Signal" value={formatNumber(tickerData.macdSignal, 4)} />
                  <StatRow
                    label="MACD Hist."
                    value={formatNumber(tickerData.macdHistogram, 4)}
                    valueClassName={changePercentClassName(tickerData.macdHistogram)}
                  />
                  <StatRow
                    label="BB Upper"
                    value={formatNumber(tickerData.bbUpper, 2, tickerData.currency)}
                  />
                  <StatRow
                    label="BB Middle"
                    value={formatNumber(tickerData.bbMiddle, 2, tickerData.currency)}
                  />
                  <StatRow
                    label="BB Lower"
                    value={formatNumber(tickerData.bbLower, 2, tickerData.currency)}
                  />
                  <StatRow label="BB Width" value={formatPercent(tickerData.bbWidth)} />
                  <StatRow
                    label="ATR (14)"
                    value={formatNumber(tickerData.atr14, 2, tickerData.currency)}
                  />
                  <StatRow
                    label="Vol Ratio (20d)"
                    value={
                      tickerData.volumeRatio20d != null
                        ? `${tickerData.volumeRatio20d.toFixed(2)}x`
                        : '—'
                    }
                  />
                </StatGroup>

                <span className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-3">
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
              currency={tickerData?.currency}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TickerDetailPage;
