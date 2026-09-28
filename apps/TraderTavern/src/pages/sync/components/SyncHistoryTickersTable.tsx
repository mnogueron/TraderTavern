import type { components } from '@trader-tavern/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CompanyCell from '@/components/table/CompanyCell';
import EmptyCell from '@/components/table/EmptyCell';

type SyncHistoryTicker = components['schemas']['SyncHistoryTickerDto'];

type SyncHistoryTickersTableProps = {
  title: string;
  titleClassName: string;
  tickers: SyncHistoryTicker[];
  showStatusAndError?: boolean;
};

const SyncHistoryTickersTable = ({
  title,
  titleClassName,
  tickers,
  showStatusAndError = false,
}: SyncHistoryTickersTableProps) => (
  <div className="flex flex-col gap-1.5">
    <span className={`text-sm font-medium ${titleClassName}`}>{title}</span>
    <Table containerClassName="max-h-64 rounded-lg border border-input">
      <TableHeader>
        <TableRow>
          <TableHead>ISIN</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Ticker</TableHead>
          {showStatusAndError && (
            <>
              <TableHead>Status</TableHead>
              <TableHead>Error</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickers.map((ticker) => (
          <TableRow key={ticker.isin}>
            <TableCell className="font-mono text-xs">{ticker.isin}</TableCell>
            <TableCell>
              {ticker.companyName || ticker.ticker ? (
                <CompanyCell
                  ticker={ticker.ticker}
                  companyName={ticker.companyName}
                  logoUrl={ticker.logoUrl}
                />
              ) : (
                <EmptyCell />
              )}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {ticker.ticker ?? '—'}
            </TableCell>
            {showStatusAndError && (
              <>
                <TableCell
                  className={
                    ticker.status === 'did_not_run'
                      ? 'text-muted-foreground'
                      : 'text-red-600'
                  }
                >
                  {ticker.status === 'did_not_run' ? 'Did not run' : 'Failed'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {ticker.error ?? '—'}
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default SyncHistoryTickersTable;
