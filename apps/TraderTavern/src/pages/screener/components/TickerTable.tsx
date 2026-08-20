import type { ApiResponse } from '@trader-tavern/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type TickerTableProps = {
  tickers: ApiResponse<'get', '/finance/screener'>;
};

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

const TickerTable = ({ tickers }: TickerTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Sector</TableHead>
          <TableHead>Industry</TableHead>
          <TableHead className="text-right">Market Cap</TableHead>
          <TableHead className="text-right">P/E</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead>Country</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickers.map((ticker) => (
          <TableRow key={ticker.ticker}>
            <TableCell className="font-medium">{ticker.ticker}</TableCell>
            <TableCell>{ticker.companyName}</TableCell>
            <TableCell>{ticker.sector ?? '—'}</TableCell>
            <TableCell>{ticker.industry ?? '—'}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMarketCap(ticker.marketCap)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(ticker.peRatio)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(ticker.price)}
            </TableCell>
            <TableCell>{ticker.country ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TickerTable;
