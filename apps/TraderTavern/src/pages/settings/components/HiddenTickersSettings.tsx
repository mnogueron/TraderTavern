import { useQueryClient } from '@tanstack/react-query';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/format';

const HiddenTickersSettings = () => {
  const queryClient = useQueryClient();

  const { data: hiddenTickers, isPending } = useClientQuery(
    'get',
    '/finance/tickers/hidden',
  );

  const unhideMutation = useClientMutation('post', '/finance/ticker/{id}/unhide', {
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['get', '/finance/tickers/hidden'],
      }),
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!hiddenTickers || hiddenTickers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tickers are currently hidden.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Errors</TableHead>
          <TableHead>Last error</TableHead>
          <TableHead>Hidden since</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {hiddenTickers.map((ticker) => (
          <TableRow key={ticker.isin}>
            <TableCell className="font-medium tabular-nums">
              {ticker.ticker}
            </TableCell>
            <TableCell>{ticker.companyName ?? '—'}</TableCell>
            <TableCell className="tabular-nums">{ticker.errorCount}</TableCell>
            <TableCell
              className="max-w-xs truncate whitespace-nowrap text-xs text-muted-foreground"
              title={ticker.lastError ?? undefined}
            >
              {ticker.lastError ?? '—'}
            </TableCell>
            <TableCell className="tabular-nums">
              {formatDateTime(ticker.hiddenAt)}
            </TableCell>
            <TableCell>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  unhideMutation.isPending &&
                  unhideMutation.variables?.params.path.id === ticker.ticker
                }
                onClick={() =>
                  unhideMutation.mutate({
                    params: { path: { id: ticker.ticker } },
                  })
                }
              >
                Unhide
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default HiddenTickersSettings;
