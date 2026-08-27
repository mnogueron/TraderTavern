import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { RiArrowLeftLine } from '@remixicon/react';
import type { ApiResponse } from '@trader-tavern/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import CountryFlag from '@/components/CountryFlag';
import {
  changePercentClassName,
  formatChangePercent,
  formatDateTime,
  formatMarketCap,
  formatNumber,
} from '@/lib/format';

type Ticker = ApiResponse<'get', '/finance/ticker/{id}'>;
type Fundamental = ApiResponse<'get', '/finance/ticker/{id}/fundamental'>;

type TickerHeaderProps = {
  ticker: Ticker | null;
  fundamental: Fundamental | null;
  isPending: boolean;
};

const TickerHeader = ({ ticker, fundamental, isPending }: TickerHeaderProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionClamped, setIsDescriptionClamped] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el || isDescriptionExpanded) return;
    setIsDescriptionClamped(el.scrollHeight > el.clientHeight + 1);
  }, [ticker?.description, isDescriptionExpanded]);

  if (isPending || !ticker) {
    return (
      <div className="flex shrink-0 items-center gap-3 border-b bg-background py-3">
        <Button variant="ghost" size="icon-sm" render={<Link to="/screener" />}>
          <RiArrowLeftLine />
        </Button>
        <Skeleton className="h-12 w-96" />
      </div>
    );
  }

  const websiteHostname = ticker.website
    ? ticker.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : null;

  const metaParts = [
    { value: ticker.market, flag: false },
    { value: ticker.country, flag: true },
    { value: ticker.sector, flag: false },
    { value: ticker.industry, flag: false },
  ].filter(
    (part): part is { value: string; flag: boolean } => part.value !== null,
  );

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b bg-background py-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" render={<Link to="/screener" />}>
          <RiArrowLeftLine />
        </Button>

        <Avatar size="lg" className="rounded-md after:rounded-md">
          {ticker.logoUrl ? <AvatarImage src={ticker.logoUrl} alt="" /> : null}
          <AvatarFallback className="rounded-md">
            {ticker.ticker.slice(0, 1)}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-col">
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-semibold">{ticker.ticker}</h1>
            <span className="truncate text-muted-foreground">
              {ticker.companyName}
            </span>
          </div>
          {metaParts.length > 0 || websiteHostname ? (
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
              {metaParts.map((part, index) => (
                <span
                  key={part.value}
                  className="flex items-center gap-1.5"
                >
                  {index > 0 && <span>·</span>}
                  {part.flag && <CountryFlag country={part.value} />}
                  {part.value}
                </span>
              ))}
              {websiteHostname && (
                <span className="flex items-center gap-1.5">
                  {metaParts.length > 0 && <span>·</span>}
                  <a
                    href={ticker.website ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground hover:underline"
                  >
                    {websiteHostname}
                  </a>
                </span>
              )}
            </div>
          ) : null}
        </div>

        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          Refreshed {formatDateTime(ticker.refreshedAt)}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <span className="text-2xl font-semibold tabular-nums">
          {formatNumber(ticker.price, 2, ticker.currency)}
        </span>
        <span
          className={`tabular-nums ${changePercentClassName(ticker.changePercent)}`}
        >
          {formatChangePercent(ticker.changePercent)}
        </span>
        <span className="text-muted-foreground">
          Mkt Cap:{' '}
          <span className="tabular-nums text-foreground">
            {formatMarketCap(fundamental?.marketCap ?? null, ticker.currency)}
          </span>
        </span>
        <span className="text-muted-foreground">
          P/E:{' '}
          <span className="tabular-nums text-foreground">
            {formatNumber(fundamental?.peRatio ?? null)}
          </span>
        </span>
        <span className="text-muted-foreground">
          Piotroski:{' '}
          <span className="tabular-nums text-foreground">
            {fundamental?.piotroskiScore != null
              ? `${fundamental.piotroskiScore}/9`
              : '—'}
          </span>
        </span>
      </div>

      {ticker.description && (
        <div className="relative text-sm text-muted-foreground">
          <p
            ref={descriptionRef}
            className={isDescriptionExpanded ? undefined : 'line-clamp-2 pr-20'}
          >
            {ticker.description}
            {isDescriptionExpanded && (
              <button
                type="button"
                className="ml-1 text-xs font-medium text-foreground hover:underline"
                onClick={() => setIsDescriptionExpanded(false)}
              >
                Show less
              </button>
            )}
          </p>
          {isDescriptionClamped && !isDescriptionExpanded && (
            <button
              type="button"
              className="absolute right-0 bottom-0 bg-background pl-1 text-xs font-medium text-foreground hover:underline"
              onClick={() => setIsDescriptionExpanded(true)}
            >
              Show more
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TickerHeader;
